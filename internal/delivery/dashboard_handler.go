package delivery

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"rest-project/internal/db"
	"rest-project/internal/models"
)

type DashboardHandler struct{}

func NewDashboardHandler() *DashboardHandler {
	return &DashboardHandler{}
}

// ─── Response types ─────────────────────────────────────────────────────────

type DashboardStats struct {
	CoursesCount       int64   `json:"courses_count"`
	StudentsCount      int64   `json:"students_count"`
	AssignmentsCount   int64   `json:"assignments_count"`
	PendingSubmissions int64   `json:"pending_submissions"`
	AverageScore       float64 `json:"average_score"`
	PromptCount        int64   `json:"prompt_count"`
}

type UpcomingDeadline struct {
	AssignmentID    uint      `json:"assignment_id"`
	AssignmentTitle string    `json:"assignment_title"`
	CourseTitle     string    `json:"course_title"`
	DueDate         time.Time `json:"due_date"`
	DaysLeft        int       `json:"days_left"`
	MaxScore        float64   `json:"max_score"`
}

type RecentSubmission struct {
	SubmissionID    uint       `json:"submission_id"`
	StudentName     string     `json:"student_name"`
	AssignmentTitle string     `json:"assignment_title"`
	CourseTitle     string     `json:"course_title"`
	Status          string     `json:"status"`
	SubmittedAt     *time.Time `json:"submitted_at"`
}

type DashCourseOverview struct {
	ID              uint    `json:"id"`
	Title           string  `json:"title"`
	StudentCount    int64   `json:"student_count"`
	AssignmentCount int64   `json:"assignment_count"`
	AvgScore        float64 `json:"avg_score"`
}

type GradeBucket struct {
	Range string `json:"range"`
	Count int64  `json:"count"`
}

type DashboardResponse struct {
	Stats             DashboardStats       `json:"stats"`
	UpcomingDeadlines []UpcomingDeadline   `json:"upcoming_deadlines"`
	RecentSubmissions []RecentSubmission   `json:"recent_submissions"`
	CourseOverviews   []DashCourseOverview `json:"course_overviews"`
	GradeDistribution []GradeBucket        `json:"grade_distribution"`
}

// ─── Handler ─────────────────────────────────────────────────────────────────

func (h *DashboardHandler) GetDashboard(c *gin.Context) {
	rawID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	teacherID := rawID.(uint)
	gdb := db.DB
	var resp DashboardResponse

	// ── 1. Stats ──────────────────────────────────────────────────────────────
	gdb.Model(&models.Course{}).
		Where("teacher_id = ?", teacherID).
		Count(&resp.Stats.CoursesCount)

	gdb.Table("course_students cs").
		Joins("JOIN courses c ON c.id = cs.course_id").
		Where("c.teacher_id = ? AND c.deleted_at IS NULL", teacherID).
		Distinct("cs.user_id").
		Count(&resp.Stats.StudentsCount)

	gdb.Model(&models.Assignment{}).
		Joins("JOIN courses c ON c.id = assignments.course_id").
		Where("c.teacher_id = ? AND c.deleted_at IS NULL", teacherID).
		Count(&resp.Stats.AssignmentsCount)

	gdb.Model(&models.AssignmentSubmission{}).
		Joins("JOIN assignments a ON a.id = assignment_submissions.assignment_id").
		Joins("JOIN courses c ON c.id = a.course_id").
		Where("c.teacher_id = ? AND assignment_submissions.status = 'submitted' AND c.deleted_at IS NULL AND assignment_submissions.deleted_at IS NULL", teacherID).
		Count(&resp.Stats.PendingSubmissions)

	gdb.Table("grades g").
		Select("COALESCE(AVG(g.score), 0)").
		Joins("JOIN assignments a ON a.id = g.assignment_id").
		Joins("JOIN courses c ON c.id = a.course_id").
		Where("c.teacher_id = ? AND c.deleted_at IS NULL AND g.deleted_at IS NULL", teacherID).
		Scan(&resp.Stats.AverageScore)

	gdb.Model(&models.Prompt{}).
		Where("teacher_id = ?", teacherID).
		Count(&resp.Stats.PromptCount)

	// ── 2. Upcoming deadlines (next 7 days) ───────────────────────────────────
	now := time.Now()
	weekLater := now.Add(7 * 24 * time.Hour)

	type upcomingRow struct {
		AssignmentID    uint
		AssignmentTitle string
		CourseTitle     string
		DueDate         time.Time
		MaxScore        float64
	}
	var upcomingRows []upcomingRow
	gdb.Table("assignments a").
		Select("a.id as assignment_id, a.title as assignment_title, c.title as course_title, a.due_date, a.max_score").
		Joins("JOIN courses c ON c.id = a.course_id").
		Where("c.teacher_id = ? AND a.due_date BETWEEN ? AND ? AND c.deleted_at IS NULL AND a.deleted_at IS NULL", teacherID, now, weekLater).
		Order("a.due_date ASC").
		Limit(5).
		Scan(&upcomingRows)

	resp.UpcomingDeadlines = make([]UpcomingDeadline, 0, len(upcomingRows))
	for _, row := range upcomingRows {
		daysLeft := int(row.DueDate.Sub(now).Hours() / 24)
		resp.UpcomingDeadlines = append(resp.UpcomingDeadlines, UpcomingDeadline{
			AssignmentID:    row.AssignmentID,
			AssignmentTitle: row.AssignmentTitle,
			CourseTitle:     row.CourseTitle,
			DueDate:         row.DueDate,
			DaysLeft:        daysLeft,
			MaxScore:        row.MaxScore,
		})
	}

	// ── 3. Recent submissions ─────────────────────────────────────────────────
	type recentRow struct {
		SubmissionID    uint
		StudentName     string
		AssignmentTitle string
		CourseTitle     string
		Status          string
		SubmittedAt     *time.Time
	}
	var recentRows []recentRow
	gdb.Table("assignment_submissions s").
		Select("s.id as submission_id, u.username as student_name, a.title as assignment_title, c.title as course_title, s.status, s.submitted_at").
		Joins("JOIN users u ON u.id = s.student_id").
		Joins("JOIN assignments a ON a.id = s.assignment_id").
		Joins("JOIN courses c ON c.id = a.course_id").
		Where("c.teacher_id = ? AND s.status IN ('submitted','graded') AND c.deleted_at IS NULL AND s.deleted_at IS NULL", teacherID).
		Order("s.submitted_at DESC").
		Limit(8).
		Scan(&recentRows)

	resp.RecentSubmissions = make([]RecentSubmission, 0, len(recentRows))
	for _, row := range recentRows {
		resp.RecentSubmissions = append(resp.RecentSubmissions, RecentSubmission{
			SubmissionID:    row.SubmissionID,
			StudentName:     row.StudentName,
			AssignmentTitle: row.AssignmentTitle,
			CourseTitle:     row.CourseTitle,
			Status:          row.Status,
			SubmittedAt:     row.SubmittedAt,
		})
	}

	// ── 4. Course overviews ───────────────────────────────────────────────────
	type courseRow struct {
		ID              uint
		Title           string
		StudentCount    int64
		AssignmentCount int64
		AvgScore        float64
	}
	var courseRows []courseRow
	gdb.Table("courses c").
		Select(`c.id, c.title,
			(SELECT COUNT(DISTINCT cs2.user_id) FROM course_students cs2 WHERE cs2.course_id = c.id) as student_count,
			(SELECT COUNT(*) FROM assignments a2 WHERE a2.course_id = c.id AND a2.deleted_at IS NULL) as assignment_count,
			COALESCE((SELECT AVG(g2.score) FROM grades g2 JOIN assignments a3 ON a3.id = g2.assignment_id WHERE a3.course_id = c.id AND g2.deleted_at IS NULL), 0) as avg_score`).
		Where("c.teacher_id = ? AND c.deleted_at IS NULL", teacherID).
		Order("c.created_at DESC").
		Limit(6).
		Scan(&courseRows)

	resp.CourseOverviews = make([]DashCourseOverview, 0, len(courseRows))
	for _, row := range courseRows {
		resp.CourseOverviews = append(resp.CourseOverviews, DashCourseOverview{
			ID:              row.ID,
			Title:           row.Title,
			StudentCount:    row.StudentCount,
			AssignmentCount: row.AssignmentCount,
			AvgScore:        row.AvgScore,
		})
	}

	// ── 5. Grade distribution ─────────────────────────────────────────────────
	type distRow struct {
		Range string
		Count int64
	}
	var distRows []distRow
	gdb.Table("grades g").
		Select(`CASE
				WHEN g.score >= 90 THEN '90-100'
				WHEN g.score >= 75 THEN '75-89'
				WHEN g.score >= 60 THEN '60-74'
				ELSE '0-59'
			END as range,
			COUNT(*) as count`).
		Joins("JOIN assignments a ON a.id = g.assignment_id").
		Joins("JOIN courses c ON c.id = a.course_id").
		Where("c.teacher_id = ? AND c.deleted_at IS NULL AND g.deleted_at IS NULL", teacherID).
		Group("range").
		Scan(&distRows)

	rangeMap := map[string]int64{"0-59": 0, "60-74": 0, "75-89": 0, "90-100": 0}
	for _, d := range distRows {
		rangeMap[d.Range] = d.Count
	}
	resp.GradeDistribution = []GradeBucket{
		{Range: "0-59", Count: rangeMap["0-59"]},
		{Range: "60-74", Count: rangeMap["60-74"]},
		{Range: "75-89", Count: rangeMap["75-89"]},
		{Range: "90-100", Count: rangeMap["90-100"]},
	}

	c.JSON(http.StatusOK, resp)
}
