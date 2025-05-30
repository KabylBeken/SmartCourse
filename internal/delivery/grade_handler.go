package delivery

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"

	"rest-project/internal/services"
	"rest-project/internal/models"
)

type GradeHandler struct {
	service      *services.GradeService
	eventService *services.EventService
}

func NewGradeHandler(service *services.GradeService, eventService *services.EventService) *GradeHandler {
	return &GradeHandler{
		service:      service,
		eventService: eventService,
	}
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

	// Получаем ID преподавателя из контекста (установлен middleware)
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

	// Логируем событие создания оценки
	if h.eventService != nil {
		h.eventService.LogEvent(models.EventGradeCreated, teacherID, map[string]any{
			"grade_id":      grade.ID,
			"assignment_id": assignmentID,
			"student_id":    input.StudentID,
		})
	}

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

	// Получаем ID преподавателя из контекста
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

	// Логируем событие обновления оценки
	if h.eventService != nil {
		h.eventService.LogEvent(models.EventGradeUpdated, teacherID, map[string]any{
			"grade_id": gradeID,
		})
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

	// Получаем ID преподавателя из контекста
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

	// Логируем событие удаления оценки
	if h.eventService != nil {
		h.eventService.LogEvent(models.EventGradeDeleted, teacherID, map[string]any{
			"grade_id": gradeID,
		})
	}

	c.JSON(http.StatusOK, gin.H{"message": "Оценка успешно удалена"})
}

// GetStudentGrades получает все оценки студента
func (h *GradeHandler) GetStudentGrades(c *gin.Context) {
	// Получаем ID студента из контекста
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован"})
		return
	}

	studentID := userID.(uint)
	
	// Логируем запрос
	if h.eventService != nil {
		h.eventService.LogEvent("get_student_grades", studentID, map[string]any{
			"student_id": studentID,
		})
	}

	grades, err := h.service.GetGradesByStudent(studentID)
	if err != nil {
		// Логируем ошибку
		if h.eventService != nil {
			h.eventService.LogEvent("get_student_grades_error", studentID, map[string]any{
				"error": err.Error(),
			})
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении оценок"})
		return
	}

	// Логируем успешное выполнение
	if h.eventService != nil {
		h.eventService.LogEvent("get_student_grades_success", studentID, map[string]any{
			"grades_count": len(grades),
		})
	}

	c.JSON(http.StatusOK, grades)
}
