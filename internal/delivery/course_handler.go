package delivery

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"rest-project/internal/services"
	"rest-project/internal/utils"
)

type CourseHandler struct {
	service *services.CourseService
}

func NewCourseHandler(service *services.CourseService) *CourseHandler {
	return &CourseHandler{service: service}
}

func currentUserID(c *gin.Context) (uint, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return 0, false
	}
	return userID.(uint), true
}

func isTeacher(c *gin.Context) bool {
	role, exists := c.Get("role")
	return exists && role == "teacher"
}

func (h *CourseHandler) GetAllCourses(c *gin.Context) {
	if isTeacher(c) {
		teacherID, ok := currentUserID(c)
		if !ok {
			return
		}
		courses, err := h.service.GetTeacherCourseSummaries(teacherID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get courses"})
			return
		}
		c.JSON(http.StatusOK, courses)
		return
	}

	courses, err := h.service.GetAllCourses()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get courses"})
		return
	}
	c.JSON(http.StatusOK, courses)
}

func (h *CourseHandler) GetCourseByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	if isTeacher(c) {
		teacherID, ok := currentUserID(c)
		if !ok {
			return
		}
		course, err := h.service.GetCourseDetailForTeacher(uint(id), teacherID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, course)
		return
	}

	course, err := h.service.GetCourseByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	c.JSON(http.StatusOK, course)
}

func (h *CourseHandler) GetTeacherCourseByID(c *gin.Context) {
	h.GetCourseByID(c)
}

func (h *CourseHandler) CreateCourse(c *gin.Context) {
	var req struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description"`
		TeacherID   uint   `json:"teacher_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	userID, ok := currentUserID(c)
	if !ok {
		return
	}

	if isTeacher(c) {
		req.TeacherID = userID
	}
	if req.TeacherID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "teacher_id is required"})
		return
	}

	course, err := h.service.CreateCourse(req.Title, req.Description, req.TeacherID)
	if err != nil {
		utils.WriteErrorLog(userID, "Courses", "Course creation failed: "+err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	utils.WriteInfoLog(userID, "Courses", "Created course: "+course.Title+" (ID:"+strconv.FormatUint(uint64(course.ID), 10)+")")
	utils.LogCourseCreated(userID, strconv.FormatUint(uint64(course.ID), 10), course.Title, c.ClientIP(), c.GetHeader("User-Agent"))

	c.JSON(http.StatusCreated, course)
}

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

	userID, ok := currentUserID(c)
	if !ok {
		return
	}

	if isTeacher(c) {
		if _, err := h.service.GetCourseDetailForTeacher(uint(id), userID); err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
	}

	course, err := h.service.UpdateCourse(uint(id), req.Title, req.Description)
	if err != nil {
		utils.WriteErrorLog(userID, "Courses", "Course update failed: "+err.Error())
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}

	utils.WriteInfoLog(userID, "Courses", "Updated course: "+course.Title+" (ID:"+strconv.FormatUint(uint64(course.ID), 10)+")")
	c.JSON(http.StatusOK, course)
}

func (h *CourseHandler) DeleteCourse(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	userID, ok := currentUserID(c)
	if !ok {
		return
	}

	var courseTitle string
	if course, err := h.service.GetCourseByID(uint(id)); err == nil {
		courseTitle = course.Title
	}

	if isTeacher(c) {
		err = h.service.DeleteCourseForTeacher(uint(id), userID)
	} else {
		err = h.service.DeleteCourse(uint(id))
	}
	if err != nil {
		utils.WriteErrorLog(userID, "Courses", "Course delete failed: "+err.Error())
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	utils.WriteInfoLog(userID, "Courses", "Deleted course ID:"+strconv.FormatUint(id, 10))
	if courseTitle != "" {
		utils.LogCourseDeleted(userID, strconv.FormatUint(id, 10), courseTitle, c.ClientIP(), c.GetHeader("User-Agent"))
	}

	c.JSON(http.StatusOK, gin.H{"message": "Course deleted successfully"})
}

func (h *CourseHandler) GetTeacherCourses(c *gin.Context) {
	teacherID, ok := currentUserID(c)
	if !ok {
		return
	}

	courses, err := h.service.GetTeacherCourseSummaries(teacherID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get courses"})
		return
	}

	c.JSON(http.StatusOK, courses)
}

func (h *CourseHandler) GetStudentCourses(c *gin.Context) {
	studentID, ok := currentUserID(c)
	if !ok {
		return
	}

	courses, err := h.service.GetCoursesByStudent(studentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get courses"})
		return
	}

	c.JSON(http.StatusOK, courses)
}

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

	userID, ok := currentUserID(c)
	if !ok {
		return
	}

	if isTeacher(c) {
		course, err := h.service.AddStudentToCourseForTeacher(uint(courseID), req.StudentID, userID)
		if err != nil {
			utils.WriteErrorLog(userID, "Courses", "Add student failed: "+err.Error())
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, course)
		return
	}

	if err := h.service.AddStudentToCourse(uint(courseID), req.StudentID); err != nil {
		utils.WriteErrorLog(userID, "Courses", "Add student failed: "+err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Student added to course successfully"})
}

func (h *CourseHandler) RemoveStudentFromCourse(c *gin.Context) {
	courseID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course ID"})
		return
	}

	var studentID uint64
	if paramID := c.Param("student_id"); paramID != "" {
		studentID, err = strconv.ParseUint(paramID, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid student ID"})
			return
		}
	} else {
		var req struct {
			StudentID uint `json:"student_id" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
			return
		}
		studentID = uint64(req.StudentID)
	}

	userID, ok := currentUserID(c)
	if !ok {
		return
	}

	if isTeacher(c) {
		course, err := h.service.RemoveStudentFromCourseForTeacher(uint(courseID), uint(studentID), userID)
		if err != nil {
			utils.WriteErrorLog(userID, "Courses", "Remove student failed: "+err.Error())
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, course)
		return
	}

	if err := h.service.RemoveStudentFromCourse(uint(courseID), uint(studentID)); err != nil {
		utils.WriteErrorLog(userID, "Courses", "Remove student failed: "+err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Student removed from course successfully"})
}

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

	if err := h.service.AssignTeacherToCourse(uint(courseID), req.TeacherID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Teacher assigned to course successfully"})
}
