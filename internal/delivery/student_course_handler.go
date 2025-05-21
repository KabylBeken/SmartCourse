package delivery

import (
	"github.com/gin-gonic/gin"
	"net/http"

	"rest-project/internal/models"
	"rest-project/internal/services"
)

type StudentCourseHandler struct {
	courseService *services.CourseService
	eventService  *services.EventService
}

func NewStudentCourseHandler(courseService *services.CourseService, eventService *services.EventService) *StudentCourseHandler {
	return &StudentCourseHandler{
		courseService: courseService,
		eventService:  eventService,
	}
}

// GetStudentCourses получает все курсы студента
func (h *StudentCourseHandler) GetStudentCourses(c *gin.Context) {
	// Получаем ID студента из контекста
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован"})
		return
	}

	studentID := userID.(uint)

	courses, err := h.courseService.GetStudentCourses(studentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении курсов студента"})
		return
	}

	// Логируем просмотр курсов
	if h.eventService != nil {
		// Используем тип события из модели
		h.eventService.LogEvent(models.EventTypeUserLogin, studentID, map[string]any{
			"action": "viewed_student_courses",
		})
	}

	c.JSON(http.StatusOK, courses)
}
