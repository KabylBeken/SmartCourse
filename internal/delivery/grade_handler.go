package delivery

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"

	"rest-project/internal/db"
	"rest-project/internal/services"
	"rest-project/internal/services/notifier"
)

type GradeHandler struct {
	service *services.GradeService
	hub     *notifier.Hub // optional
}

func NewGradeHandler(service *services.GradeService) *GradeHandler {
	return &GradeHandler{
		service: service,
	}
}

// SetHub — подключает WebSocket-хаб для нотификаций (опционально).
func (h *GradeHandler) SetHub(hub *notifier.Hub) {
	h.hub = hub
}

// notifyStudent — отправляет студенту событие grade_updated.
func (h *GradeHandler) notifyStudent(studentID, assignmentID uint, score float64) {
	if h.hub == nil {
		return
	}
	var meta struct {
		AssignmentTitle string `gorm:"column:assignment_title"`
		CourseTitle     string `gorm:"column:course_title"`
	}
	_ = db.DB.Table("assignments a").
		Select("a.title AS assignment_title, c.title AS course_title").
		Joins("JOIN courses c ON c.id = a.course_id").
		Where("a.id = ?", assignmentID).
		Limit(1).
		Scan(&meta).Error
	h.hub.SendToUser(studentID, "grade_updated", map[string]any{
		"assignment_id":    assignmentID,
		"assignment_title": meta.AssignmentTitle,
		"course_title":     meta.CourseTitle,
		"score":            score,
	})
}

// GetAssignmentGrades получает все оценки для конкретного задания
func (h *GradeHandler) GetAssignmentGrades(c *gin.Context) {
	assignmentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID задания"})
		return
	}

	grades, err := h.service.GetGradesByAssignment(uint(assignmentID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении оценок"})
		return
	}

	c.JSON(http.StatusOK, grades)
}

// CreateGrade создает новую оценку для задания
func (h *GradeHandler) CreateGrade(c *gin.Context) {
	assignmentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID задания"})
		return
	}

	var input struct {
		StudentID uint    `json:"student_id" binding:"required"`
		Score     float64 `json:"score" binding:"required"`
		Feedback  string  `json:"feedback"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные данные для оценки"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован"})
		return
	}

	teacherID := userID.(uint)

	grade, err := h.service.CreateGrade(
		uint(assignmentID),
		input.StudentID,
		input.Score,
		input.Feedback,
		teacherID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	go h.notifyStudent(input.StudentID, uint(assignmentID), input.Score)

	c.JSON(http.StatusCreated, grade)
}

// UpdateGrade обновляет оценку
func (h *GradeHandler) UpdateGrade(c *gin.Context) {
	gradeID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID оценки"})
		return
	}

	var input struct {
		Score    float64 `json:"score" binding:"required"`
		Feedback string  `json:"feedback"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные данные для оценки"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован"})
		return
	}

	teacherID := userID.(uint)

	grade, err := h.service.UpdateGrade(
		uint(gradeID),
		input.Score,
		input.Feedback,
		teacherID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if grade != nil {
		go h.notifyStudent(grade.StudentID, grade.AssignmentID, grade.Score)
	}

	c.JSON(http.StatusOK, grade)
}

// DeleteGrade удаляет оценку
func (h *GradeHandler) DeleteGrade(c *gin.Context) {
	gradeID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID оценки"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован"})
		return
	}

	teacherID := userID.(uint)

	err = h.service.DeleteGrade(uint(gradeID), teacherID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Оценка успешно удалена"})
}

// GetStudentGrades получает все оценки студента
func (h *GradeHandler) GetStudentGrades(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован"})
		return
	}

	studentID := userID.(uint)

	grades, err := h.service.GetGradesByStudent(studentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении оценок"})
		return
	}

	c.JSON(http.StatusOK, grades)
}
