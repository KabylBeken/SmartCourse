package delivery

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
	"time"

	"rest-project/internal/services"
	"rest-project/internal/models"
)

type AssignmentHandler struct {
	service      *services.AssignmentService
	eventService *services.EventService
}

func NewAssignmentHandler(service *services.AssignmentService, eventService *services.EventService) *AssignmentHandler {
	return &AssignmentHandler{
		service:      service,
		eventService: eventService,
	}
}

// GetCourseAssignments получает все задания для курса
func (h *AssignmentHandler) GetCourseAssignments(c *gin.Context) {
	courseID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID курса"})
		return
	}

	assignments, err := h.service.GetAssignmentsByCourse(uint(courseID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении заданий"})
		return
	}

	c.JSON(http.StatusOK, assignments)
}

// CreateAssignment создает новое задание для курса
func (h *AssignmentHandler) CreateAssignment(c *gin.Context) {
	courseID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID курса"})
		return
	}

	var input struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		DueDate     string `json:"due_date" binding:"required"` // Формат ISO: "2006-01-02T15:04:05Z"
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные данные для задания"})
		return
	}

	dueDate, err := time.Parse(time.RFC3339, input.DueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат даты дедлайна"})
		return
	}

	// Получаем ID преподавателя из контекста (установлен middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован"})
		return
	}

	teacherID := userID.(uint)

	assignment, err := h.service.CreateAssignment(
		input.Title,
		input.Description,
		uint(courseID),
		dueDate,
		teacherID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Логируем событие создания задания
	if h.eventService != nil {
		h.eventService.LogEvent(models.EventAssignmentCreated, teacherID, map[string]any{
			"assignment_id": assignment.ID,
			"course_id":     courseID,
		})
	}

	c.JSON(http.StatusCreated, assignment)
}

// UpdateAssignment обновляет задание
func (h *AssignmentHandler) UpdateAssignment(c *gin.Context) {
	assignmentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID задания"})
		return
	}

	var input struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		DueDate     string `json:"due_date" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные данные для задания"})
		return
	}

	dueDate, err := time.Parse(time.RFC3339, input.DueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат даты дедлайна"})
		return
	}

	// Получаем ID преподавателя из контекста
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован"})
		return
	}

	teacherID := userID.(uint)

	assignment, err := h.service.UpdateAssignment(
		uint(assignmentID),
		input.Title,
		input.Description,
		dueDate,
		teacherID,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Логируем событие обновления задания
	if h.eventService != nil {
		h.eventService.LogEvent(models.EventAssignmentUpdated, teacherID, map[string]any{
			"assignment_id": assignmentID,
		})
	}

	c.JSON(http.StatusOK, assignment)
}

// DeleteAssignment удаляет задание
func (h *AssignmentHandler) DeleteAssignment(c *gin.Context) {
	assignmentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID задания"})
		return
	}

	// Получаем ID преподавателя из контекста
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован"})
		return
	}

	teacherID := userID.(uint)

	// Сначала проверяем, есть ли задание (включая удаленные) для информации
	assignment, err := h.service.GetAssignmentByIDWithDeleted(uint(assignmentID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Задание не найдено"})
		return
	}

	// Проверяем, удалено ли уже задание
	if !assignment.DeletedAt.Time.IsZero() {
		c.JSON(http.StatusOK, gin.H{
			"message": "Задание уже удалено",
			"deleted_assignment": map[string]any{
				"id":          assignment.ID,
				"title":       assignment.Title,
				"description": assignment.Description,
				"course_id":   assignment.CourseID,
				"due_date":    assignment.DueDate.Format(time.RFC3339),
				"deleted_at":  assignment.DeletedAt.Time.Format(time.RFC3339),
			},
		})
		return
	}

	// Если задание не удалено, пытаемся удалить его
	err = h.service.DeleteAssignment(uint(assignmentID), teacherID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Логируем событие удаления задания
	if h.eventService != nil {
		h.eventService.LogEvent(models.EventAssignmentDeleted, teacherID, map[string]any{
			"assignment_id": assignmentID,
			"assignment_data": map[string]any{
				"title":       assignment.Title,
				"description": assignment.Description,
				"course_id":   assignment.CourseID,
				"due_date":    assignment.DueDate.Format(time.RFC3339),
			},
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Задание успешно удалено",
		"deleted_assignment": map[string]any{
			"id":          assignmentID,
			"title":       assignment.Title,
			"description": assignment.Description,
			"course_id":   assignment.CourseID,
			"due_date":    assignment.DueDate.Format(time.RFC3339),
		},
	})
}
