package middleware

import (
	"github.com/gin-gonic/gin"
	"rest-project/internal/utils"
	"strconv"
	"time"
)

// MetricMiddleware измеряет время выполнения запроса и записывает метрику
func MetricMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()
		
		// Обработка запроса
		c.Next()
		
		// Вычисляем длительность запроса
		duration := time.Since(startTime).Seconds()
		
		// Получаем информацию о запросе
		path := c.Request.URL.Path
		method := c.Request.Method
		statusCode := c.Writer.Status()
		userID, exists := c.Get("user_id")
		
		// Записываем метрику длительности запроса
		utils.RecordRequestDuration(path, method, duration)
		
		// Записываем метрику и лог
		if exists {
			utils.WriteInfoLog(userID.(uint), "Metrics", 
				"Запрос "+method+" "+path+" выполнен за "+
				strconv.FormatFloat(duration, 'f', 4, 64)+"с, статус: "+
				strconv.Itoa(statusCode))
		} else {
			utils.WriteInfoLog(0, "Metrics", 
				"Запрос "+method+" "+path+" выполнен за "+
				strconv.FormatFloat(duration, 'f', 4, 64)+"с, статус: "+
				strconv.Itoa(statusCode))
		}
		
		// Увеличиваем счетчик запросов
		labels := map[string]string{
			"path":        path,
			"method":      method,
			"status_code": strconv.Itoa(statusCode),
		}
		utils.IncrementCounter("http_requests_total", labels)
	}
}

// RequestCounterMiddleware считает количество запросов
func RequestCounterMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Выполнение запроса
		c.Next()
		
		// Получаем информацию о запросе
		path := c.Request.URL.Path
		method := c.Request.Method
		statusCode := c.Writer.Status()
		
		// Увеличиваем счетчик запросов
		labels := map[string]string{
			"path":   path,
			"method": method,
			"status": strconv.Itoa(statusCode),
		}
		utils.IncrementCounter("api_requests", labels)
		
		// Для тестирования просто записываем информацию в лог
		utils.WriteInfoLog(0, "Metrics", 
			"Выполнен запрос "+method+" "+path+", статус: "+
			strconv.Itoa(statusCode))
	}
} 