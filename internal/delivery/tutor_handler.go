package delivery

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"rest-project/internal/models"
	"rest-project/internal/services/tutor"
)

type TutorHandler struct {
	svc *tutor.Service
}

func NewTutorHandler(svc *tutor.Service) *TutorHandler {
	return &TutorHandler{svc: svc}
}

func (h *TutorHandler) studentID(c *gin.Context) (uint, bool) {
	uid, ok := c.Get("user_id")
	if !ok {
		return 0, false
	}
	id, ok := uid.(uint)
	return id, ok
}

// GET /api/student/assignments/:id/tutor
func (h *TutorHandler) GetSession(c *gin.Context) {
	sid, ok := h.studentID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	assignID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid assignment id"})
		return
	}
	session, err := h.svc.GetOrCreate(sid, uint(assignID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	msgs, err := h.svc.GetMessages(session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, models.TutorSessionResponse{
		Session:  *session,
		Messages: msgs,
	})
}

// POST /api/student/assignments/:id/tutor/stream
// Body: { "content": "..." }
// Response: text/event-stream
func (h *TutorHandler) Stream(c *gin.Context) {
	sid, ok := h.studentID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	assignID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid assignment id"})
		return
	}
	var req models.TutorChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	req.Content = strings.TrimSpace(req.Content)
	if req.Content == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "content is required"})
		return
	}

	session, err := h.svc.GetOrCreate(sid, uint(assignID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	history, err := h.svc.GetMessages(session.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	aiMsgs, err := h.svc.BuildMessages(uint(assignID), history, req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if _, err := h.svc.SaveMessage(session.ID, "user", req.Content); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")
	c.Header("Transfer-Encoding", "chunked")

	ctx := c.Request.Context()
	ch := make(chan string, 64)

	var fullResponse strings.Builder

	go func() {
		defer close(ch)
		h.svc.Stream(ctx, aiMsgs, ch)
	}()

	c.Stream(func(w io.Writer) bool {
		select {
		case <-ctx.Done():
			return false
		case delta, open := <-ch:
			if !open {
				// Жауапты сақтау
				if fullResponse.Len() > 0 {
					h.svc.SaveMessage(session.ID, "assistant", fullResponse.String())
				}
				// SSE done event
				fmt.Fprint(w, "data: [DONE]\n\n")
				return false
			}
			fullResponse.WriteString(delta)
			payload, _ := json.Marshal(map[string]string{"delta": delta})
			fmt.Fprintf(w, "data: %s\n\n", payload)
			return true
		}
	})
}

// DELETE /api/student/assignments/:id/tutor
func (h *TutorHandler) ClearHistory(c *gin.Context) {
	sid, ok := h.studentID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	assignID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid assignment id"})
		return
	}
	if err := h.svc.ClearHistory(sid, uint(assignID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "history cleared"})
}
