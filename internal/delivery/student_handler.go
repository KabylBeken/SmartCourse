package delivery

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"rest-project/internal/models"
	"rest-project/internal/services"
	"rest-project/internal/utils"
	"strconv"
)

// Конструктор
func NewStudentHandler(service *services.StudentService) *StudentHandler {
	return &StudentHandler{service: service}
}

type StudentHandler struct {
	service *services.StudentService
}

// Получение списка всех студентов
func (h *StudentHandler) GetAllStudents(c *gin.Context) {
	students, err := h.service.GetAllStudents()
	if err != nil {
		utils.WriteErrorLog(0, "Students", "Ошибка получения списка студентов: "+err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения списка студентов"})
		return
	}
	c.JSON(http.StatusOK, students)
}

// Получение студента по ID
func (h *StudentHandler) GetStudent(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный ID студента"})
		return
	}

	student, err := h.service.GetStudentByID(id)
	if err != nil {
		utils.WriteErrorLog(0, "Students", "Ошибка получения студента: "+err.Error())
		c.JSON(http.StatusNotFound, gin.H{"error": "Студент не найден"})
		return
	}

	c.JSON(http.StatusOK, student)
}

// Создание нового студента
func (h *StudentHandler) CreateStudent(c *gin.Context) {
	var req struct {
		FullName  string `json:"full_name" binding:"required"`
		Birthdate string `json:"birthdate"`
		Age       int    `json:"age"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	student, err := h.service.Create(req.FullName, req.Birthdate, req.Age)
	if err != nil {
		utils.WriteErrorLog(userID.(uint), "Students", "Ошибка создания студента: "+err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	utils.WriteInfoLog(userID.(uint), "Students", "Создан новый студент: "+student.FullName)
	c.JSON(http.StatusCreated, student)
}

// Обновление данных студента
func (h *StudentHandler) UpdateStudent(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный ID студента"})
		return
	}

	var req models.StudentEdit
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректные данные"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	student, err := h.service.Update(id, &req)
	if err != nil {
		utils.WriteErrorLog(userID.(uint), "Students", "Ошибка обновления студента: "+err.Error())
		c.JSON(http.StatusNotFound, gin.H{"error": "Ошибка обновления студента"})
		return
	}

	utils.WriteInfoLog(userID.(uint), "Students", "Обновлен студент: "+student.FullName)
	c.JSON(http.StatusOK, student)
}

// Удаление студента
func (h *StudentHandler) DeleteStudent(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный ID студента"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Получаем студента перед удалением для логирования
	student, err := h.service.GetStudentByID(id)
	if err == nil {
		utils.WriteInfoLog(userID.(uint), "Students", "Удален студент: "+student.FullName)
	}

	err = h.service.DeleteStudent(id)
	if err != nil {
		utils.WriteErrorLog(userID.(uint), "Students", "Ошибка удаления студента: "+err.Error())
		c.JSON(http.StatusNotFound, gin.H{"error": "Ошибка удаления студента"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Студент удален"})
}
