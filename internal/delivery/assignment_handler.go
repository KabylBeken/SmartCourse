package delivery

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strconv"
	"time"

	"rest-project/internal/models"
	"rest-project/internal/services"
)

type AssignmentHandler struct {
	service *services.AssignmentService
}

func NewAssignmentHandler(service *services.AssignmentService) *AssignmentHandler {
	return &AssignmentHandler{service: service}
}

// createAssignmentInput — тапсырма жасауға/өзгертуге арналған input
type createAssignmentInput struct {
	Title       string          `json:"title" binding:"required"`
	Description string          `json:"description"`
	DueDate     string          `json:"due_date" binding:"required"`
	MaxScore    float64         `json:"max_score"`
	Type        string          `json:"type"`
	WordCount   int             `json:"word_count"`
	Criteria    []criterionInput `json:"criteria"`
	Questions   []questionInput  `json:"questions"`
}

type criterionInput struct {
	ID            int     `json:"id"`
	Name          string  `json:"name"`
	MaxPoints     int     `json:"maxPoints"`
	MaxScore      int     `json:"max_score"`
	Description   string  `json:"description"`
	Weight        float64 `json:"weight"`
	AutoCheckable bool    `json:"auto_checkable"`
	CheckPrompt   string  `json:"check_prompt"`
	OrderIndex    int     `json:"order_index"`
}

type questionInput struct {
	ID           int      `json:"id"`
	Question     string   `json:"question"`
	Options      []string `json:"options"`
	CorrectIndex int      `json:"correctIndex"`
	Explanation  string   `json:"explanation"`
}

type updateCriteriaInput struct {
	Criteria []criterionInput `json:"criteria"`
}

// GetCourseAssignments — Teacher: correctIndex КӨРІНЕДІ
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

// GetCourseAssignmentsForStudent — Student: correctIndex ЖАСЫРЫЛҒАН (-1)
func (h *AssignmentHandler) GetCourseAssignmentsForStudent(c *gin.Context) {
	courseID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID курса"})
		return
	}
	assignments, err := h.service.GetAssignmentsByCourseForStudent(uint(courseID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении заданий"})
		return
	}
	c.JSON(http.StatusOK, assignments)
}

// GetAssignment — Teacher: one assignment by ID with criteria/questions.
func (h *AssignmentHandler) GetAssignment(c *gin.Context) {
	assignmentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid assignment id"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user is not authorized"})
		return
	}
	teacherID := userID.(uint)

	assignment, err := h.service.GetAssignmentForTeacher(uint(assignmentID), teacherID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, assignment)
}

// GetAssignmentForStudent — Student: one assignment by ID with hidden test answers.
func (h *AssignmentHandler) GetAssignmentForStudent(c *gin.Context) {
	assignmentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid assignment id"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user is not authorized"})
		return
	}
	studentID := userID.(uint)

	assignment, err := h.service.GetAssignmentForStudent(uint(assignmentID), studentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, assignment)
}

// CreateAssignment — essay / test тапсырма жасау
func (h *AssignmentHandler) CreateAssignment(c *gin.Context) {
	courseID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID курса"})
		return
	}

	var input createAssignmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные данные: " + err.Error()})
		return
	}

	dueDate, err := time.Parse(time.RFC3339, input.DueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат даты (RFC3339)"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован"})
		return
	}
	teacherID := userID.(uint)

	req := buildRequest(input, uint(courseID), dueDate)
	assignment, err := h.service.CreateAssignment(req, teacherID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, assignment)
}

// UpdateAssignment — тапсырманы өзгерту
func (h *AssignmentHandler) UpdateAssignment(c *gin.Context) {
	assignmentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID задания"})
		return
	}

	var input createAssignmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверные данные: " + err.Error()})
		return
	}

	dueDate, err := time.Parse(time.RFC3339, input.DueDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат даты (RFC3339)"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован"})
		return
	}
	teacherID := userID.(uint)

	req := buildRequest(input, 0, dueDate) // courseID update-та өзгермейді
	assignment, err := h.service.UpdateAssignment(uint(assignmentID), req, teacherID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, assignment)
}

// UpdateAssignmentCriteria — Teacher: saves only essay grading criteria.
func (h *AssignmentHandler) UpdateAssignmentCriteria(c *gin.Context) {
	assignmentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid assignment id"})
		return
	}

	var input updateCriteriaInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid criteria data: " + err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user is not authorized"})
		return
	}
	teacherID := userID.(uint)

	criteria := make([]models.EssayCriterion, 0, len(input.Criteria))
	for _, ci := range input.Criteria {
		maxPoints := ci.MaxPoints
		if maxPoints == 0 {
			maxPoints = ci.MaxScore
		}
		criteria = append(criteria, models.EssayCriterion{
			ID:            ci.ID,
			Name:          ci.Name,
			MaxPoints:     maxPoints,
			MaxScore:      ci.MaxScore,
			Description:   ci.Description,
			Weight:        ci.Weight,
			AutoCheckable: ci.AutoCheckable,
			CheckPrompt:   ci.CheckPrompt,
			OrderIndex:    ci.OrderIndex,
		})
	}

	assignment, err := h.service.UpdateAssignmentCriteria(uint(assignmentID), criteria, teacherID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, assignment)
}

// DeleteAssignment — тапсырманы жою
func (h *AssignmentHandler) DeleteAssignment(c *gin.Context) {
	assignmentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат ID задания"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован"})
		return
	}
	teacherID := userID.(uint)

	assignment, err := h.service.GetAssignmentByIDWithDeleted(uint(assignmentID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Задание не найдено"})
		return
	}
	if !assignment.DeletedAt.Time.IsZero() {
		c.JSON(http.StatusOK, gin.H{"message": "Задание уже удалено"})
		return
	}

	err = h.service.DeleteAssignment(uint(assignmentID), teacherID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "Задание успешно удалено",
		"deleted_assignment": gin.H{
			"id":    assignmentID,
			"title": assignment.Title,
		},
	})
}

// buildRequest — input-ты CreateAssignmentRequest-ке айналдырады
func buildRequest(input createAssignmentInput, courseID uint, dueDate time.Time) services.CreateAssignmentRequest {
	req := services.CreateAssignmentRequest{
		Title:       input.Title,
		Description: input.Description,
		CourseID:    courseID,
		DueDate:     dueDate,
		MaxScore:    input.MaxScore,
		Type:        input.Type,
		WordCount:   input.WordCount,
	}
	for _, ci := range input.Criteria {
		maxPoints := ci.MaxPoints
		if maxPoints == 0 {
			maxPoints = ci.MaxScore
		}
		req.Criteria = append(req.Criteria, models.EssayCriterion{
			ID:            ci.ID,
			Name:          ci.Name,
			MaxPoints:     maxPoints,
			MaxScore:      ci.MaxScore,
			Description:   ci.Description,
			Weight:        ci.Weight,
			AutoCheckable: ci.AutoCheckable,
			CheckPrompt:   ci.CheckPrompt,
			OrderIndex:    ci.OrderIndex,
		})
	}
	for _, qi := range input.Questions {
		req.Questions = append(req.Questions, models.TestQuestion{
			ID:           qi.ID,
			Question:     qi.Question,
			Options:      qi.Options,
			CorrectIndex: qi.CorrectIndex,
			Explanation:  qi.Explanation,
		})
	}
	return req
}
