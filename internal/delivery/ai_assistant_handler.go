package delivery

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"rest-project/internal/services/queue"
)

// AIAssistantHandler — учитель үшін AI генерация ұтыстарын кезекке қояды.
// Барлығы async (Redis queue). Status `/api/teacher/jobs/:id` арқылы.
type AIAssistantHandler struct {
	q *queue.Queue
}

func NewAIAssistantHandler(q *queue.Queue) *AIAssistantHandler {
	return &AIAssistantHandler{q: q}
}

func (h *AIAssistantHandler) enqueue(c *gin.Context, jobType string, payload any) {
	if h.q == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "queue disabled"})
		return
	}
	uid, _ := c.Get("user_id")
	userID, _ := uid.(uint)

	raw, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}
	ctx, cancel := contextWithTimeout(c, 5*time.Second)
	defer cancel()

	id, err := h.q.Enqueue(ctx, jobType, json.RawMessage(raw), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"job_id": id, "status": "queued", "type": jobType})
}

// POST /api/teacher/ai/lesson-plan
func (h *AIAssistantHandler) LessonPlan(c *gin.Context) {
	var input struct {
		Topic      string `json:"topic" binding:"required"`
		GradeLevel string `json:"grade_level"`
		Duration   int    `json:"duration"`
		BloomLevel string `json:"bloom_level"`
		Language   string `json:"language"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "topic is required"})
		return
	}
	h.enqueue(c, "ai_lesson_plan", input)
}

// POST /api/teacher/ai/test-generate
func (h *AIAssistantHandler) TestGenerate(c *gin.Context) {
	var input struct {
		Topic      string `json:"topic" binding:"required"`
		Count      int    `json:"count"`
		Difficulty string `json:"difficulty"`
		Language   string `json:"language"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "topic is required"})
		return
	}
	h.enqueue(c, "ai_test_generate", input)
}

// POST /api/teacher/ai/improve
func (h *AIAssistantHandler) Improve(c *gin.Context) {
	var input struct {
		SubmissionText  string `json:"submission_text" binding:"required"`
		AssignmentName  string `json:"assignment_name"`
		CurrentFeedback string `json:"current_feedback"`
		Language        string `json:"language"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "submission_text is required"})
		return
	}
	h.enqueue(c, "ai_improve_suggestion", input)
}
