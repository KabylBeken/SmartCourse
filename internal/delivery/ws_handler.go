package delivery

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"rest-project/internal/auth"
	"rest-project/internal/services/notifier"
)

type WSHandler struct {
	hub *notifier.Hub
}

func NewWSHandler(hub *notifier.Hub) *WSHandler {
	return &WSHandler{hub: hub}
}

var wsUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Browser отправляет ?token=... — origin проверять не будем,
	// в проде стоит ограничить.
	CheckOrigin: func(r *http.Request) bool { return true },
}

// Connect — GET /ws?token=JWT
// Использует token из query (WebSocket в браузере не умеет отправлять Authorization-заголовок).
func (h *WSHandler) Connect(c *gin.Context) {
	tokenStr := c.Query("token")
	if tokenStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "token required"})
		return
	}
	claims := &auth.Claims{}
	tok, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(auth.JWTSecret), nil
	})
	if err != nil || !tok.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	conn, err := wsUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	client := notifier.NewClient(claims.UserID, conn)
	h.hub.Add(client)
	go client.Run(h.hub)
}
