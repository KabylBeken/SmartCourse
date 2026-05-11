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
	ID           uint      `json:"id"`
	Title        string    `json:"title"`
	Start        time.Time `json:"start"`
	AllDay       bool      `json:"all_day"`
	AssignmentID uint      `json:"assignment_id"`
	CourseTitle  string    `json:"course_title"`
	Color        string    `json:"color"`
	Type         string    `json:"type"`
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

	type row struct {
		ID          uint      `gorm:"column:id"`
		Title       string    `gorm:"column:title"`
		DueDate     time.Time `gorm:"column:due_date"`
		CourseTitle string    `gorm:"column:course_title"`
	}

	query := h.db.Raw(`
		SELECT a.id, a.title, a.due_date, c.title AS course_title
		FROM assignments a
		JOIN courses c ON c.id = a.course_id
		JOIN course_students cs ON cs.course_id = c.id
		WHERE cs.student_id = ?
		  AND a.due_date IS NOT NULL
	`, studentID)

	if !start.IsZero() {
		query = h.db.Raw(`
			SELECT a.id, a.title, a.due_date, c.title AS course_title
			FROM assignments a
			JOIN courses c ON c.id = a.course_id
			JOIN course_students cs ON cs.course_id = c.id
			WHERE cs.student_id = ?
			  AND a.due_date IS NOT NULL
			  AND a.due_date >= ?
		`, studentID, start)
	}
	if !start.IsZero() && !end.IsZero() {
		query = h.db.Raw(`
			SELECT a.id, a.title, a.due_date, c.title AS course_title
			FROM assignments a
			JOIN courses c ON c.id = a.course_id
			JOIN course_students cs ON cs.course_id = c.id
			WHERE cs.student_id = ?
			  AND a.due_date IS NOT NULL
			  AND a.due_date >= ?
			  AND a.due_date <= ?
		`, studentID, start, end)
	}

	var rows []row
	if err := query.Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	events := make([]CalendarEvent, 0, len(rows))
	for _, r := range rows {
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

	c.JSON(http.StatusOK, events)
}
