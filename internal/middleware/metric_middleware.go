package middleware

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"rest-project/internal/utils"
)

// MetricMiddleware измеряет время выполнения запроса
func MetricMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()

		c.Next()

		duration := time.Since(startTime).Seconds()
		path := c.Request.URL.Path
		method := c.Request.Method
		statusCode := c.Writer.Status()

		utils.RecordRequestDuration(path, method, duration)

		userID, exists := c.Get("user_id")
		if exists {
			utils.WriteInfoLog(userID.(uint), "Metrics",
				"Запрос "+method+" "+path+" выполнен за "+
					strconv.FormatFloat(duration, 'f', 4, 64)+"с, статус: "+
					strconv.Itoa(statusCode))
		}
	}
}
