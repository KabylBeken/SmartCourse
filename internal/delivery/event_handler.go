package delivery

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"rest-project/internal/auth"
	"rest-project/internal/models"
	"rest-project/internal/services"
)

type EventHandler struct {
	eventService *services.EventService
}

func NewEventHandler(eventService *services.EventService) *EventHandler {
	return &EventHandler{
		eventService: eventService,
	}
}

// GetEvents получает события с пагинацией
func (h *EventHandler) GetEvents(c *gin.Context) {
	eventType := c.Query("type")
	resourceType := c.Query("resource_type")
	
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("page_size", "10")
	
	page, err := strconv.ParseInt(pageStr, 10, 64)
	if err != nil || page < 1 {
		page = 1
	}
	
	pageSize, err := strconv.ParseInt(pageSizeStr, 10, 64)
	if err != nil || pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	
	var eventTypeEnum models.EventType
	if eventType != "" {
		eventTypeEnum = models.EventType(eventType)
	}
	
	events, total, err := h.eventService.GetEvents(eventTypeEnum, resourceType, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения событий"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": events,
		"meta": gin.H{
			"page":      page,
			"page_size": pageSize,
			"total":     total,
		},
	})
}

// GetUserEvents получает события пользователя
func (h *EventHandler) GetUserEvents(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный ID пользователя"})
		return
	}
	
	// Проверяем права доступа: только админ или сам пользователь
	claims, exists := c.Get("claims")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Не авторизован"})
		return
	}
	
	userClaims := claims.(*auth.Claims)
	if userClaims.Role != "admin" && userClaims.UserID != uint(userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещен"})
		return
	}
	
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("page_size", "10")
	
	page, err := strconv.ParseInt(pageStr, 10, 64)
	if err != nil || page < 1 {
		page = 1
	}
	
	pageSize, err := strconv.ParseInt(pageSizeStr, 10, 64)
	if err != nil || pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}
	
	events, total, err := h.eventService.GetUserEvents(uint(userID), page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения событий пользователя"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": events,
		"meta": gin.H{
			"page":      page,
			"page_size": pageSize,
			"total":     total,
		},
	})
} 