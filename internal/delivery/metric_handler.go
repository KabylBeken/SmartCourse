package delivery

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"rest-project/internal/models"
	"rest-project/internal/services"
)

type MetricHandler struct {
	metricService *services.MetricService
}

func NewMetricHandler(metricService *services.MetricService) *MetricHandler {
	return &MetricHandler{
		metricService: metricService,
	}
}

// GetMetrics получает метрики с пагинацией
func (h *MetricHandler) GetMetrics(c *gin.Context) {
	metricName := c.Query("name")
	metricType := c.Query("type")
	
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
	
	var metricTypeEnum models.MetricType
	if metricType != "" {
		metricTypeEnum = models.MetricType(metricType)
	}
	
	metrics, total, err := h.metricService.GetMetrics(metricName, metricTypeEnum, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка получения метрик"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": metrics,
		"meta": gin.H{
			"page":      page,
			"page_size": pageSize,
			"total":     total,
		},
	})
} 