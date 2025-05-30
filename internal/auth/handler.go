package auth

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"rest-project/internal/models"
	"rest-project/internal/services"
	"rest-project/internal/utils"
)

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"omitempty,oneof=admin teacher student"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthHandler struct {
	userService  *services.UserService
	eventService *services.EventService
}

func NewAuthHandler(userService *services.UserService, eventService *services.EventService) *AuthHandler {
	return &AuthHandler{
		userService:  userService,
		eventService: eventService,
	}
}

// Register регистрирует нового пользователя
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.WriteWarningLog(0, "Auth", "Ошибка валидации данных при регистрации: "+err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Преобразуем строковую роль в тип models.Role
	var role models.Role
	
	// Если роль не указана, устанавливаем по умолчанию student
	if req.Role == "" {
		role = models.RoleStudent
		// Логируем установку роли по умолчанию
		utils.WriteInfoLog(0, "Auth", "Роль не указана, установлена по умолчанию: student")
	} else {
		// Обрабатываем указанную роль
		switch req.Role {
		case "admin":
			role = models.RoleAdmin
		case "teacher":
			role = models.RoleTeacher
		case "student":
			role = models.RoleStudent
		default:
			utils.WriteWarningLog(0, "Auth", "Попытка регистрации с некорректной ролью: "+req.Role)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректная роль"})
			return
		}
	}

	// Создаем пользователя через сервис
	user, err := h.userService.CreateUser(req.Username, req.Password, role)
	if err != nil {
		utils.WriteErrorLog(0, "Auth", "Ошибка создания пользователя: "+err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка создания пользователя: " + err.Error()})
		return
	}

	// Логируем успешную регистрацию
	utils.WriteInfoLog(user.ID, "Auth", "Зарегистрирован новый пользователь: "+user.Username+" с ролью "+string(user.Role))
	
	// Записываем событие регистрации
	utils.LogRegistration(user.ID, c.ClientIP(), c.GetHeader("User-Agent"))

	// Также используем eventService если он доступен (для обратной совместимости)
	if h.eventService != nil {
		h.eventService.RecordUserRegistrationEvent(
			user.ID,
			c.ClientIP(),
			c.GetHeader("User-Agent"),
		)
	}

	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     string(user.Role),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // токен действителен 24 часа
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(JWTSecret))
	if err != nil {
		utils.WriteErrorLog(user.ID, "Auth", "Ошибка создания токена: "+err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания токена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"role":     user.Role,
		},
	})
}

// Login авторизует пользователя
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.WriteWarningLog(0, "Auth", "Ошибка валидации данных при входе: "+err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Ищем пользователя по имени пользователя
	users, err := h.userService.GetAllUsers()
	if err != nil {
		utils.WriteErrorLog(0, "Auth", "Ошибка получения пользователей: "+err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения пользователей"})
		return
	}

	var user *models.User
	for i := range users {
		if users[i].Username == req.Username {
			user = &users[i]
			break
		}
	}

	if user == nil {
		utils.WriteWarningLog(0, "Auth", "Попытка входа с несуществующим пользователем: "+req.Username)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверные учетные данные"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		utils.WriteWarningLog(user.ID, "Auth", "Неверный пароль для пользователя: "+user.Username)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Неверные учетные данные"})
		return
	}

	// Логируем успешный вход
	utils.WriteInfoLog(user.ID, "Auth", "Успешный вход пользователя: "+user.Username)
	
	// Записываем событие входа в систему
	utils.LogLogin(user.ID, c.ClientIP(), c.GetHeader("User-Agent"))

	// Также используем eventService если он доступен (для обратной совместимости)
	if h.eventService != nil {
		h.eventService.RecordUserLoginEvent(
			user.ID,
			c.ClientIP(),
			c.GetHeader("User-Agent"),
		)
	}

	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     string(user.Role),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // токен действителен 24 часа
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(JWTSecret))
	if err != nil {
		utils.WriteErrorLog(user.ID, "Auth", "Ошибка создания токена: "+err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка создания токена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"role":     user.Role,
		},
	})
}
