package delivery

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"rest-project/internal/db"
	"rest-project/internal/services"
	"rest-project/internal/services/notifier"
)

type AssignmentSubmissionHandler struct {
	service *services.AssignmentSubmissionService
	hub     *notifier.Hub // optional
}

func NewAssignmentSubmissionHandler(service *services.AssignmentSubmissionService) *AssignmentSubmissionHandler {
	return &AssignmentSubmissionHandler{service: service}
}

// SetHub — подключает WebSocket-хаб для нотификаций (опционально).
func (h *AssignmentSubmissionHandler) SetHub(hub *notifier.Hub) {
	h.hub = hub
}

func (h *AssignmentSubmissionHandler) GetStudentSubmission(c *gin.Context) {
	assignmentID, err := parseAssignmentID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid assignment id"})
		return
	}

	studentID, ok := getCurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user is not authorized"})
		return
	}

	submission, err := h.service.GetStudentSubmission(assignmentID, studentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, submission)
}

func (h *AssignmentSubmissionHandler) SaveDraft(c *gin.Context) {
	h.save(c, false)
}

func (h *AssignmentSubmissionHandler) Submit(c *gin.Context) {
	h.save(c, true)
}

func (h *AssignmentSubmissionHandler) save(c *gin.Context, final bool) {
	assignmentID, err := parseAssignmentID(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid assignment id"})
		return
	}

	studentID, ok := getCurrentUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user is not authorized"})
		return
	}

	var input services.AssignmentSubmissionRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid submission data: " + err.Error()})
		return
	}

	var submission any
	if final {
		submission, err = h.service.Submit(assignmentID, studentID, input)
	} else {
		submission, err = h.service.SaveDraft(assignmentID, studentID, input)
	}
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if final && h.hub != nil {
		go h.notifyTeacher(assignmentID, studentID)
	}

	c.JSON(http.StatusOK, submission)
}

// notifyTeacher — асинхронно отправляет teacher'у WS-событие submission_submitted.
func (h *AssignmentSubmissionHandler) notifyTeacher(assignmentID, studentID uint) {
	var info struct {
		TeacherID       uint   `gorm:"column:teacher_id"`
		AssignmentTitle string `gorm:"column:assignment_title"`
		CourseTitle     string `gorm:"column:course_title"`
		StudentName     string `gorm:"column:student_name"`
	}
	err := db.DB.Table("assignments a").
		Select("c.teacher_id AS teacher_id, a.title AS assignment_title, c.title AS course_title, u.username AS student_name").
		Joins("JOIN courses c ON c.id = a.course_id").
		Joins("JOIN users u ON u.id = ?", studentID).
		Where("a.id = ? AND a.deleted_at IS NULL", assignmentID).
		Limit(1).
		Scan(&info).Error
	if err != nil || info.TeacherID == 0 {
		return
	}
	h.hub.SendToUser(info.TeacherID, "submission_submitted", map[string]any{
		"assignment_id":    assignmentID,
		"student_id":       studentID,
		"student_name":     info.StudentName,
		"assignment_title": info.AssignmentTitle,
		"course_title":     info.CourseTitle,
	})
}

func parseAssignmentID(c *gin.Context) (uint, error) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	return uint(id), err
}

func getCurrentUserID(c *gin.Context) (uint, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}

	id, ok := userID.(uint)
	return id, ok
}
