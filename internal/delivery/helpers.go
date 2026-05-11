package delivery

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
)

// contextWithTimeout — производит контекст с таймаутом, привязанный к gin.Context.
func contextWithTimeout(c *gin.Context, d time.Duration) (context.Context, context.CancelFunc) {
	return context.WithTimeout(c.Request.Context(), d)
}
