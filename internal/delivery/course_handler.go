package delivery

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"rest-project/internal/services"
	"rest-project/internal/utils"
	"strconv"
)

type CourseHandler struct {
	service     *services.CourseService
	eventService *services.EventService
}

func NewCourseHandler(service *services.CourseService, eventService *services.EventService) *CourseHandler {
	return &CourseHandler{
		service: service,
		eventService: eventService,
	}
}

// GetAllCourses возвращает список всех курсов (только для администратора)
func (h *CourseHandler) GetAllCourses(c *gin.Context) {
	courses, err := h.service.GetAllCourses()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get courses"})
		return
	}
	c.JSON(http.StatusOK, courses)
}

// GetCourseByID возвращает курс по ID
func (h *CourseHandler) GetCourseByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	course, err := h.service.GetCourseByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	c.JSON(http.StatusOK, course)
}

// CreateCourse создает новый курс (только для администратора)
func (h *CourseHandler) CreateCourse(c *gin.Context) {
	var req struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		TeacherID   uint   `json:"teacher_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	course, err := h.service.CreateCourse(req.Title, req.Description, req.TeacherID)
	if err != nil {
		utils.WriteErrorLog(userID.(uint), "Courses", "Ошибка создания курса: "+err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Записываем лог
	utils.WriteInfoLog(userID.(uint), "Courses", "Создан новый курс: "+course.Title+" (ID:"+strconv.FormatUint(uint64(course.ID), 10)+")")
	
	// Записываем событие
	courseID := strconv.FormatUint(uint64(course.ID), 10)
	utils.LogCourseCreated(userID.(uint), courseID, course.Title, c.ClientIP(), c.GetHeader("User-Agent"))

	// Записываем событие создания курса через eventService (для обратной совместимости)
	if h.eventService != nil {
		h.eventService.RecordCourseCreatedEvent(
			userID.(uint),
			courseID,
			course.Title,
			c.ClientIP(),
			c.GetHeader("User-Agent"),
		)
	}

	c.JSON(http.StatusCreated, course)
}

// UpdateCourse обновляет курс (только для администратора)
func (h *CourseHandler) UpdateCourse(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	var req struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	course, err := h.service.UpdateCourse(uint(id), req.Title, req.Description)
	if err != nil {
		utils.WriteErrorLog(userID.(uint), "Courses", "Ошибка обновления курса: "+err.Error())
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	// Записываем лог
	utils.WriteInfoLog(userID.(uint), "Courses", "Обновлен курс: "+course.Title+" (ID:"+strconv.FormatUint(uint64(course.ID), 10)+")")

	c.JSON(http.StatusOK, course)
}

// DeleteCourse удаляет курс (только для администратора)
func (h *CourseHandler) DeleteCourse(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Получаем курс перед удалением для логирования
	course, err := h.service.GetCourseByID(uint(id))
	if err == nil {
		// Записываем лог
		utils.WriteInfoLog(userID.(uint), "Courses", "Удален курс: "+course.Title+" (ID:"+strconv.FormatUint(uint64(course.ID), 10)+")")
		
		courseID := strconv.FormatUint(uint64(course.ID), 10)
		// Записываем событие удаления
		utils.LogCourseDeleted(userID.(uint), courseID, course.Title, c.ClientIP(), c.GetHeader("User-Agent"))

		// Записываем событие удаления курса (для обратной совместимости)
		if h.eventService != nil {
			h.eventService.RecordEvent(
				"COURSE_DELETED",
				userID.(uint),
				courseID,
				"course",
				map[string]any{"course_name": course.Title},
				c.ClientIP(),
				c.GetHeader("User-Agent"),
			)
		}
	} else {
		utils.WriteErrorLog(userID.(uint), "Courses", "Ошибка получения курса перед удалением: "+err.Error())
	}

	err = h.service.DeleteCourse(uint(id))
	if err != nil {
		utils.WriteErrorLog(userID.(uint), "Courses", "Ошибка удаления курса: "+err.Error())
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Course deleted successfully"})
}

// GetTeacherCourses возвращает курсы преподавателя
func (h *CourseHandler) GetTeacherCourses(c *gin.Context) {
	teacherID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	courses, err := h.service.GetCoursesByTeacher(teacherID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get courses"})
		return
	}

	c.JSON(http.StatusOK, courses)
}

// GetStudentCourses возвращает курсы студента
func (h *CourseHandler) GetStudentCourses(c *gin.Context) {
	studentID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	courses, err := h.service.GetCoursesByStudent(studentID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get courses"})
		return
	}

	c.JSON(http.StatusOK, courses)
}

// AddStudentToCourse добавляет студента на курс (только для администратора)
func (h *CourseHandler) AddStudentToCourse(c *gin.Context) {
	courseID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	var req struct {
		StudentID uint `json:"student_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	err = h.service.AddStudentToCourse(uint(courseID), req.StudentID)
	if err != nil {
		utils.WriteErrorLog(userID.(uint), "Courses", 
			"Ошибка добавления студента (ID:"+strconv.FormatUint(uint64(req.StudentID), 10)+
			") на курс (ID:"+strconv.FormatUint(courseID, 10)+"): "+err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Записываем лог
	utils.WriteInfoLog(userID.(uint), "Courses", 
		"Студент (ID:"+strconv.FormatUint(uint64(req.StudentID), 10)+
		") добавлен на курс (ID:"+strconv.FormatUint(courseID, 10)+")")

	c.JSON(http.StatusOK, gin.H{"message": "Student added to course successfully"})
}

// RemoveStudentFromCourse удаляет студента с курса (только для администратора)
func (h *CourseHandler) RemoveStudentFromCourse(c *gin.Context) {
	courseID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	var req struct {
		StudentID uint `json:"student_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	err = h.service.RemoveStudentFromCourse(uint(courseID), req.StudentID)
	if err != nil {
		utils.WriteErrorLog(userID.(uint), "Courses", 
			"Ошибка удаления студента (ID:"+strconv.FormatUint(uint64(req.StudentID), 10)+
			") с курса (ID:"+strconv.FormatUint(courseID, 10)+"): "+err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Записываем лог
	utils.WriteInfoLog(userID.(uint), "Courses", 
		"Студент (ID:"+strconv.FormatUint(uint64(req.StudentID), 10)+
		") удален с курса (ID:"+strconv.FormatUint(courseID, 10)+")")

	c.JSON(http.StatusOK, gin.H{"message": "Student removed from course successfully"})
}

// AssignTeacherToCourse назначает преподавателя на курс (только для администратора)
func (h *CourseHandler) AssignTeacherToCourse(c *gin.Context) {
	courseID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	var req struct {
		TeacherID uint `json:"teacher_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	err = h.service.AssignTeacherToCourse(uint(courseID), req.TeacherID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Teacher assigned to course successfully"})
}
