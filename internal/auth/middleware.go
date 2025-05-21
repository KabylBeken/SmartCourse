package auth

import (
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"net/http"
	"strings"
	"rest-project/internal/utils"
)

// Claims представляет данные, хранящиеся в JWT токене
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// AuthMiddleware проверяет JWT токен для аутентификации
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Требуется авторизация"})
			c.Abort()
			return
		}

		// Обрезаем префикс "Bearer " если он есть
		if len(tokenString) > 7 && strings.ToUpper(tokenString[0:7]) == "BEARER " {
			tokenString = tokenString[7:]
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(
			tokenString, 
			claims, 
			func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("неожиданный метод подписи: %v", token.Header["alg"])
				}
				return []byte(JWTSecret), nil
			},
		)

		if err != nil {
			if err == jwt.ErrTokenExpired {
				utils.WriteWarningLog(0, "Auth", "Истек срок действия токена")
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Истек срок действия токена"})
			} else {
				utils.WriteWarningLog(0, "Auth", "Недействительный токен: "+err.Error())
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Недействительный токен"})
			}
			c.Abort()
			return
		}

		if !token.Valid {
			utils.WriteWarningLog(0, "Auth", "Недействительный токен")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Недействительный токен"})
			c.Abort()
			return
		}

		// Записываем данные пользователя в контекст
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)
		
		// Логируем успешную аутентификацию
		utils.WriteInfoLog(claims.UserID, "Auth", "Успешная аутентификация пользователя "+claims.Username)
		
		c.Next()
	}
}

// RoleMiddleware проверяет роль пользователя
func RoleMiddleware(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			utils.WriteWarningLog(0, "Auth", "Роль не найдена в контексте")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Роль не найдена"})
			c.Abort()
			return
		}

		if userRole != role {
			userID, _ := c.Get("user_id")
			username, _ := c.Get("username")
			utils.WriteWarningLog(userID.(uint), "Auth", 
				fmt.Sprintf("Доступ запрещен для пользователя %s (роль %s). Требуется роль: %s", 
					username, userRole, role))
			
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещен"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// AdminMiddleware проверяет, что пользователь имеет роль admin
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Требуется авторизация"})
			c.Abort()
			return
		}

		if userRole != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ только для администраторов"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// validateToken проверяет JWT токен и возвращает ID пользователя
func validateToken(tokenString string) (uint, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Проверяем алгоритм подписи
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(JWTSecret), nil
	})

	if err != nil {
		return 0, err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID, ok := claims["user_id"].(float64)
		if !ok {
			return 0, errors.New("invalid token claims")
		}
		return uint(userID), nil
	}

	return 0, errors.New("invalid token")
} 