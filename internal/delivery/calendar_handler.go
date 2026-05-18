package delivery

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CalendarHandler struct {
	db *gorm.DB
}

func NewCalendarHandler(db *gorm.DB) *CalendarHandler {
	return &CalendarHandler{db: db}
}

// CalendarEvent — student calendar-ға қайтарылатын оқиға
type CalendarEvent struct {
	ID           uint       `json:"id"`
	Title        string     `json:"title"`
	Start        time.Time  `json:"start"`
	End          *time.Time `json:"end,omitempty"`
	AllDay       bool       `json:"all_day"`
	AssignmentID uint       `json:"assignment_id"`
	CourseTitle  string     `json:"course_title"`
	Color        string     `json:"color"`
	Type         string     `json:"type"`
}

// GET /api/student/calendar?start=ISO&end=ISO
func (h *CalendarHandler) GetStudentCalendar(c *gin.Context) {
	uid, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	studentID, ok := uid.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var start, end time.Time
	if s := c.Query("start"); s != "" {
		start, _ = time.Parse(time.RFC3339, s)
	}
	if e := c.Query("end"); e != "" {
		end, _ = time.Parse(time.RFC3339, e)
	}

	events := make([]CalendarEvent, 0)

	// ── 1. Assignment deadlines ─────────────────────────────────────────────
	type deadlineRow struct {
		ID          uint      `gorm:"column:id"`
		Title       string    `gorm:"column:title"`
		DueDate     time.Time `gorm:"column:due_date"`
		CourseTitle string    `gorm:"column:course_title"`
	}

	deadlineSQL := `
		SELECT a.id, a.title, a.due_date, c.title AS course_title
		FROM assignments a
		JOIN courses c ON c.id = a.course_id
		JOIN course_students cs ON cs.course_id = c.id
		WHERE cs.user_id = ?
		  AND a.due_date IS NOT NULL
		  AND a.deleted_at IS NULL`

	args := []interface{}{studentID}
	if !start.IsZero() {
		deadlineSQL += " AND a.due_date >= ?"
		args = append(args, start)
	}
	if !end.IsZero() {
		deadlineSQL += " AND a.due_date <= ?"
		args = append(args, end)
	}

	var deadlines []deadlineRow
	if err := h.db.Raw(deadlineSQL, args...).Scan(&deadlines).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	for _, r := range deadlines {
		events = append(events, CalendarEvent{
			ID:           r.ID,
			Title:        "📌 " + r.Title,
			Start:        r.DueDate,
			AllDay:       false,
			AssignmentID: r.ID,
			CourseTitle:  r.CourseTitle,
			Color:        "#ef4444",
			Type:         "deadline",
		})
	}

	// ── 2. Teacher schedule events for student's courses ───────────────────
	type scheduleRow struct {
		ID           uint       `gorm:"column:id"`
		Title        string     `gorm:"column:title"`
		StartTime    time.Time  `gorm:"column:start_time"`
		EndTime      *time.Time `gorm:"column:end_time"`
		AllDay       bool       `gorm:"column:all_day"`
		Type         string     `gorm:"column:type"`
		Color        string     `gorm:"column:color"`
		AssignmentID *uint      `gorm:"column:assignment_id"`
		CourseTitle  string     `gorm:"column:course_title"`
	}

	schedSQL := `
		SELECT se.id, se.title, se.start_time, se.end_time, se.all_day,
		       se.type, se.color, se.assignment_id, c.title AS course_title
		FROM schedule_events se
		JOIN courses c ON c.id = se.course_id
		JOIN course_students cs ON cs.course_id = se.course_id
		WHERE cs.user_id = ?`

	schedArgs := []interface{}{studentID}
	if !start.IsZero() {
		schedSQL += " AND se.start_time >= ?"
		schedArgs = append(schedArgs, start)
	}
	if !end.IsZero() {
		schedSQL += " AND se.start_time <= ?"
		schedArgs = append(schedArgs, end)
	}
	schedSQL += " ORDER BY se.start_time ASC"

	var schedRows []scheduleRow
	if err := h.db.Raw(schedSQL, schedArgs...).Scan(&schedRows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	typeColors := map[string]string{
		"lesson":   "#6366f1",
		"deadline": "#ef4444",
		"exam":     "#f97316",
		"holiday":  "#22c55e",
		"meeting":  "#3b82f6",
		"other":    "#8b5cf6",
	}

	for _, r := range schedRows {
		color := r.Color
		if color == "" {
			if c2, ok := typeColors[r.Type]; ok {
				color = c2
			} else {
				color = "#6366f1"
			}
		}
		var assignID uint
		if r.AssignmentID != nil {
			assignID = *r.AssignmentID
		}
		events = append(events, CalendarEvent{
			ID:           r.ID,
			Title:        r.Title,
			Start:        r.StartTime,
			End:          r.EndTime,
			AllDay:       r.AllDay,
			AssignmentID: assignID,
			CourseTitle:  r.CourseTitle,
			Color:        color,
			Type:         r.Type,
		})
	}

	c.JSON(http.StatusOK, events)
}
