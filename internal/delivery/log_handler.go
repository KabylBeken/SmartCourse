package delivery

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"rest-project/internal/models"
	"rest-project/internal/services"
)

type LogHandler struct {
	loggerService *services.LoggerService
}

func NewLogHandler(loggerService *services.LoggerService) *LogHandler {
	return &LogHandler{
		loggerService: loggerService,
	}
}

// GetLogs получает логи с пагинацией
func (h *LogHandler) GetLogs(c *gin.Context) {
	logType := c.Query("type")
	component := c.Query("component")
	
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
	
	var logTypeEnum models.LogType
	if logType != "" {
		logTypeEnum = models.LogType(logType)
	}
	
	logs, total, err := h.loggerService.GetLogs(logTypeEnum, component, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения логов"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": logs,
		"meta": gin.H{
			"page":      page,
			"page_size": pageSize,
			"total":     total,
		},
	})
} 