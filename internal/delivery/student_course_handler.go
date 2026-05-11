package delivery

import (
	"github.com/gin-gonic/gin"
	"net/http"

	"rest-project/internal/services"
)

type StudentCourseHandler struct {
	courseService *services.CourseService
}

func NewStudentCourseHandler(courseService *services.CourseService) *StudentCourseHandler {
	return &StudentCourseHandler{
		courseService: courseService,
	}
}

// GetStudentCourses получает все курсы студента
func (h *StudentCourseHandler) GetStudentCourses(c *gin.Context) {
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

	c.JSON(http.StatusOK, courses)
}
