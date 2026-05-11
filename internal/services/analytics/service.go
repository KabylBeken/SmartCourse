package analytics

import (
	"time"

	"gorm.io/gorm"
)

// Service — учитель аналитикасы үшін есеп-агрегаттар жасайды.
// Тек бар таблицалар (users/courses/assignments/grades/assignment_submissions) пайдаланылады.
type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

// ── Overview ───────────────────────────────────────────────────────────────

type Overview struct {
	StudentsTotal    int     `json:"students_total"`
	CoursesTotal     int     `json:"courses_total"`
	AssignmentsTotal int     `json:"assignments_total"`
	SubmissionsTotal int     `json:"submissions_total"`
	GradesTotal      int     `json:"grades_total"`
	AvgScore         float64 `json:"avg_score"`
	CompletionRate   float64 `json:"completion_rate"` // 0..1
}

func (s *Service) Overview(teacherID uint) (*Overview, error) {
	o := &Overview{}

	// teacher-ге тиісті курс ID-лер
	var courseIDs []uint
	if err := s.db.Table("courses").
		Where("teacher_id = ? AND deleted_at IS NULL", teacherID).
		Pluck("id", &courseIDs).Error; err != nil {
		return nil, err
	}
	o.CoursesTotal = len(courseIDs)

	if len(courseIDs) == 0 {
		return o, nil
	}

	// студенттер саны (unique)
	var students int64
	_ = s.db.Table("course_students").
		Where("course_id IN ?", courseIDs).
		Distinct("user_id").
		Count(&students).Error
	o.StudentsTotal = int(students)

	// assignments
	var assignmentIDs []uint
	_ = s.db.Table("assignments").
		Where("course_id IN ? AND deleted_at IS NULL", courseIDs).
		Pluck("id", &assignmentIDs).Error
	o.AssignmentsTotal = len(assignmentIDs)

	if len(assignmentIDs) == 0 {
		return o, nil
	}

	// submissions
	var subs int64
	_ = s.db.Table("assignment_submissions").
		Where("assignment_id IN ? AND deleted_at IS NULL", assignmentIDs).
		Where("status IN ?", []string{"submitted", "late", "graded"}).
		Count(&subs).Error
	o.SubmissionsTotal = int(subs)

	// grades + avg
	type aggRow struct {
		Cnt int64
		Avg float64
	}
	var ag aggRow
	_ = s.db.Table("grades").
		Select("COUNT(*) AS cnt, COALESCE(AVG(score),0) AS avg").
		Where("assignment_id IN ? AND deleted_at IS NULL", assignmentIDs).
		Scan(&ag).Error
	o.GradesTotal = int(ag.Cnt)
	o.AvgScore = round2(ag.Avg)

	// completion = submissions / (students × assignments)
	denom := float64(o.StudentsTotal * o.AssignmentsTotal)
	if denom > 0 {
		o.CompletionRate = round2(float64(o.SubmissionsTotal) / denom)
	}
	return o, nil
}

// ── Grades over time ───────────────────────────────────────────────────────

type GradeBucket struct {
	Date     string  `json:"date"`      // YYYY-MM-DD
	AvgScore float64 `json:"avg_score"`
	Count    int     `json:"count"`
}

func (s *Service) GradesOverTime(teacherID uint, courseID uint, days int) ([]GradeBucket, error) {
	if days <= 0 {
		days = 30
	}
	since := time.Now().AddDate(0, 0, -days)

	// teacher-ге тиісті курс ID-лер
	var courseIDs []uint
	q := s.db.Table("courses").Where("teacher_id = ? AND deleted_at IS NULL", teacherID)
	if courseID > 0 {
		q = q.Where("id = ?", courseID)
	}
	if err := q.Pluck("id", &courseIDs).Error; err != nil {
		return nil, err
	}
	if len(courseIDs) == 0 {
		return []GradeBucket{}, nil
	}

	type row struct {
		Day   time.Time
		Avg   float64
		Count int64
	}
	var rows []row
	if err := s.db.Raw(`
		SELECT DATE_TRUNC('day', g.created_at) AS day,
		       COALESCE(AVG(g.score),0) AS avg,
		       COUNT(*) AS count
		FROM grades g
		JOIN assignments a ON a.id = g.assignment_id
		WHERE a.course_id IN ?
		  AND g.created_at >= ?
		  AND g.deleted_at IS NULL
		  AND a.deleted_at IS NULL
		GROUP BY day
		ORDER BY day ASC
	`, courseIDs, since).Scan(&rows).Error; err != nil {
		return nil, err
	}

	out := make([]GradeBucket, 0, len(rows))
	for _, r := range rows {
		out = append(out, GradeBucket{
			Date:     r.Day.Format("2006-01-02"),
			AvgScore: round2(r.Avg),
			Count:    int(r.Count),
		})
	}
	return out, nil
}

// ── Heatmap (студент × тапсырма) ────────────────────────────────────────────

type HeatmapCell struct {
	AssignmentID    uint    `json:"assignment_id"`
	AssignmentTitle string  `json:"assignment_title"`
	Score           float64 `json:"score"`
	MaxScore        float64 `json:"max_score"`
	Status          string  `json:"status"` // graded|submitted|missing
}

type HeatmapRow struct {
	StudentID   uint          `json:"student_id"`
	StudentName string        `json:"student_name"`
	Cells       []HeatmapCell `json:"cells"`
	AvgScore    float64       `json:"avg_score"`
}

type HeatmapResponse struct {
	Assignments []HeatmapAssignment `json:"assignments"`
	Rows        []HeatmapRow        `json:"rows"`
}

type HeatmapAssignment struct {
	ID       uint    `json:"id"`
	Title    string  `json:"title"`
	MaxScore float64 `json:"max_score"`
}

func (s *Service) Heatmap(teacherID uint, courseID uint) (*HeatmapResponse, error) {
	resp := &HeatmapResponse{Assignments: []HeatmapAssignment{}, Rows: []HeatmapRow{}}

	var courseIDs []uint
	q := s.db.Table("courses").Where("teacher_id = ? AND deleted_at IS NULL", teacherID)
	if courseID > 0 {
		q = q.Where("id = ?", courseID)
	}
	if err := q.Pluck("id", &courseIDs).Error; err != nil {
		return nil, err
	}
	if len(courseIDs) == 0 {
		return resp, nil
	}

	// тапсырмалар
	type aRow struct {
		ID       uint
		Title    string
		MaxScore float64 `gorm:"column:max_score"`
	}
	var aRows []aRow
	if err := s.db.Table("assignments").
		Select("id, title, max_score").
		Where("course_id IN ? AND deleted_at IS NULL", courseIDs).
		Order("due_date ASC, id ASC").
		Scan(&aRows).Error; err != nil {
		return nil, err
	}
	for _, a := range aRows {
		resp.Assignments = append(resp.Assignments, HeatmapAssignment{ID: a.ID, Title: a.Title, MaxScore: a.MaxScore})
	}
	if len(aRows) == 0 {
		return resp, nil
	}

	// студенттер
	type sRow struct {
		ID       uint
		Username string
	}
	var sRows []sRow
	if err := s.db.Table("users u").
		Select("u.id, u.username").
		Joins("JOIN course_students cs ON cs.user_id = u.id").
		Where("cs.course_id IN ?", courseIDs).
		Where("u.role = ?", "student").
		Group("u.id, u.username").
		Order("u.username ASC").
		Scan(&sRows).Error; err != nil {
		return nil, err
	}
	if len(sRows) == 0 {
		return resp, nil
	}

	assignmentIDs := make([]uint, 0, len(aRows))
	for _, a := range aRows {
		assignmentIDs = append(assignmentIDs, a.ID)
	}
	studentIDs := make([]uint, 0, len(sRows))
	for _, st := range sRows {
		studentIDs = append(studentIDs, st.ID)
	}

	// баға картасы: (student_id, assignment_id) → score
	type gRow struct {
		StudentID    uint    `gorm:"column:student_id"`
		AssignmentID uint    `gorm:"column:assignment_id"`
		Score        float64 `gorm:"column:score"`
	}
	var gRows []gRow
	_ = s.db.Table("grades").
		Select("student_id, assignment_id, score").
		Where("assignment_id IN ? AND student_id IN ? AND deleted_at IS NULL", assignmentIDs, studentIDs).
		Scan(&gRows).Error
	gradeMap := make(map[uint]map[uint]float64, len(studentIDs))
	for _, g := range gRows {
		if gradeMap[g.StudentID] == nil {
			gradeMap[g.StudentID] = map[uint]float64{}
		}
		gradeMap[g.StudentID][g.AssignmentID] = g.Score
	}

	// submission картасы (status көрсету үшін)
	type subRow struct {
		StudentID    uint   `gorm:"column:student_id"`
		AssignmentID uint   `gorm:"column:assignment_id"`
		Status       string `gorm:"column:status"`
	}
	var subRows []subRow
	_ = s.db.Table("assignment_submissions").
		Select("student_id, assignment_id, status").
		Where("assignment_id IN ? AND student_id IN ? AND deleted_at IS NULL", assignmentIDs, studentIDs).
		Scan(&subRows).Error
	subMap := make(map[uint]map[uint]string, len(studentIDs))
	for _, s := range subRows {
		if subMap[s.StudentID] == nil {
			subMap[s.StudentID] = map[uint]string{}
		}
		subMap[s.StudentID][s.AssignmentID] = s.Status
	}

	for _, st := range sRows {
		row := HeatmapRow{StudentID: st.ID, StudentName: st.Username}
		var sum, cnt float64
		for _, a := range aRows {
			cell := HeatmapCell{
				AssignmentID:    a.ID,
				AssignmentTitle: a.Title,
				MaxScore:        a.MaxScore,
				Status:          "missing",
			}
			if score, ok := gradeMap[st.ID][a.ID]; ok {
				cell.Score = score
				cell.Status = "graded"
				sum += score
				cnt++
			} else if subStatus, ok := subMap[st.ID][a.ID]; ok {
				cell.Status = subStatus
			}
			row.Cells = append(row.Cells, cell)
		}
		if cnt > 0 {
			row.AvgScore = round2(sum / cnt)
		}
		resp.Rows = append(resp.Rows, row)
	}
	return resp, nil
}

// ── At-risk students ──────────────────────────────────────────────────────

type AtRiskStudent struct {
	StudentID       uint    `json:"student_id"`
	StudentName     string  `json:"student_name"`
	AvgScore        float64 `json:"avg_score"`
	GradedCount     int     `json:"graded_count"`
	MissingCount    int     `json:"missing_count"`
	TotalAssignments int    `json:"total_assignments"`
	Reason          string  `json:"reason"`
}

func (s *Service) AtRisk(teacherID uint, courseID uint, threshold float64) ([]AtRiskStudent, error) {
	if threshold <= 0 {
		threshold = 60
	}
	hm, err := s.Heatmap(teacherID, courseID)
	if err != nil {
		return nil, err
	}
	total := len(hm.Assignments)
	out := []AtRiskStudent{}
	for _, r := range hm.Rows {
		graded := 0
		missing := 0
		for _, c := range r.Cells {
			switch c.Status {
			case "graded":
				graded++
			case "missing":
				missing++
			}
		}
		isLow := r.AvgScore > 0 && r.AvgScore < threshold
		// >40% missing → at risk
		isMissingMany := total > 0 && float64(missing)/float64(total) > 0.4
		if !isLow && !isMissingMany {
			continue
		}
		reason := ""
		switch {
		case isLow && isMissingMany:
			reason = "Низкая средняя оценка + много пропусков"
		case isLow:
			reason = "Средняя оценка ниже порога"
		default:
			reason = "Большое количество пропущенных заданий"
		}
		out = append(out, AtRiskStudent{
			StudentID:        r.StudentID,
			StudentName:      r.StudentName,
			AvgScore:         r.AvgScore,
			GradedCount:      graded,
			MissingCount:     missing,
			TotalAssignments: total,
			Reason:           reason,
		})
	}
	return out, nil
}

func round2(x float64) float64 {
	return float64(int64(x*100+0.5)) / 100
}
