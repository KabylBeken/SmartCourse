package delivery

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"rest-project/internal/services/queue"
)

type JobsHandler struct {
	q *queue.Queue
}

func NewJobsHandler(q *queue.Queue) *JobsHandler {
	return &JobsHandler{q: q}
}

// EnqueueRequest — вход для постановки задачи в очередь.
type enqueueRequest struct {
	Type    string          `json:"type" binding:"required"`
	Payload json.RawMessage `json:"payload"`
}

// Enqueue — POST /api/teacher/jobs
func (h *JobsHandler) Enqueue(c *gin.Context) {
	if h.q == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "queue disabled"})
		return
	}
	var req enqueueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}
	uid, _ := c.Get("user_id")
	userID, _ := uid.(uint)

	ctx, cancel := contextWithTimeout(c, 5*time.Second)
	defer cancel()

	id, err := h.q.Enqueue(ctx, req.Type, json.RawMessage(req.Payload), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"job_id": id, "status": "queued"})
}

// Status — GET /api/teacher/jobs/:id
func (h *JobsHandler) Status(c *gin.Context) {
	if h.q == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "queue disabled"})
		return
	}
	id := c.Param("id")
	ctx, cancel := contextWithTimeout(c, 3*time.Second)
	defer cancel()
	st, err := h.q.GetStatus(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if st == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}
	c.JSON(http.StatusOK, st)
}
