package delivery

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"rest-project/internal/db"
	"rest-project/internal/models"
	aiservice "rest-project/internal/services/ai"
)

// EssayReviewHandler — teacher эссені AI-мен тексеру.
type EssayReviewHandler struct {
	ai *aiservice.OpenRouterClient
}

func NewEssayReviewHandler(ai *aiservice.OpenRouterClient) *EssayReviewHandler {
	return &EssayReviewHandler{ai: ai}
}

// POST /api/teacher/assignments/:id/ai-review
// Body: { "content": "...", "student_id": 123 }
func (h *EssayReviewHandler) Review(c *gin.Context) {
	if h.ai == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI қызметі қосылмаған"})
		return
	}

	assignmentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid assignment id"})
		return
	}

	var body struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "content is required"})
		return
	}
	body.Content = strings.TrimSpace(body.Content)
	if body.Content == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "essay content is empty"})
		return
	}

	// Assignment + criteria
	var assignment models.Assignment
	if err := db.DB.First(&assignment, assignmentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "assignment not found"})
		return
	}

	var criteria []models.EssayCriterion
	if assignment.Criteria != "" {
		_ = json.Unmarshal([]byte(assignment.Criteria), &criteria)
	}

	prompt := buildEssayReviewPrompt(assignment, criteria, body.Content)

	ctx, cancel := context.WithTimeout(c.Request.Context(), 90*time.Second)
	defer cancel()

	raw, err := h.ai.Chat(ctx, []aiservice.Message{
		{
			Role: "system",
			Content: "Сен тәжірибелі мектеп мұғалімінің AI-көмекшісісің. " +
				"Эссені берілген критерийлер бойынша мұқият тексер. " +
				"Жауапты қазақ тілінде бер. Нақты болып, конструктивті пікір жаз.",
		},
		{Role: "user", Content: prompt},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	suggestedScore, feedback := parseEssayReviewResponse(raw, assignment.MaxScore)

	c.JSON(http.StatusOK, gin.H{
		"suggested_score": suggestedScore,
		"feedback":        feedback,
	})
}

func buildEssayReviewPrompt(a models.Assignment, criteria []models.EssayCriterion, content string) string {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("## Тапсырма: %s\n", a.Title))
	if a.Description != "" {
		sb.WriteString(fmt.Sprintf("Сипаттама: %s\n", a.Description))
	}
	sb.WriteString(fmt.Sprintf("Максималды балл: %.0f\n\n", a.MaxScore))

	if len(criteria) > 0 {
		sb.WriteString("## Бағалау критерийлері:\n")
		for i, cr := range criteria {
			sb.WriteString(fmt.Sprintf("%d. **%s** (макс. %d балл)\n", i+1, cr.Name, cr.MaxPoints))
			if cr.Description != "" {
				sb.WriteString(fmt.Sprintf("   %s\n", cr.Description))
			}
		}
		sb.WriteString("\n")
	}

	sb.WriteString("## Студент эссесі:\n```\n")
	sb.WriteString(content)
	sb.WriteString("\n```\n\n")

	sb.WriteString("## Нұсқаулар:\n")
	sb.WriteString("Жоғарыдағы эссені критерийлер бойынша тексер. Жауапты ТЕК осы форматта бер:\n\n")
	sb.WriteString(fmt.Sprintf("ҰСЫНЫЛАТЫН_БАЛЛ: [0-%.0f арасындағы бүтін немесе ондық сан]\n\n", a.MaxScore))
	sb.WriteString("ПІКІР:\n")
	sb.WriteString("[Мұнда әр критерий бойынша нақты бағалауды жаз. ")
	sb.WriteString("Жақсы жақтарын, кемшіліктерін, және жақсарту жолдарын атап өт.]\n")

	return sb.String()
}

// parseEssayReviewResponse — AI жауабынан балл мен пікірді шығарады.
func parseEssayReviewResponse(response string, maxScore float64) (float64, string) {
	var suggestedScore float64 = -1
	var feedbackLines []string
	inFeedback := false

	for _, line := range strings.Split(response, "\n") {
		trimmed := strings.TrimSpace(line)

		if strings.HasPrefix(trimmed, "ҰСЫНЫЛАТЫН_БАЛЛ:") || strings.HasPrefix(trimmed, "ҰСЫНЫЛАТЫН БАЛЛ:") {
			parts := strings.SplitN(trimmed, ":", 2)
			if len(parts) == 2 {
				numStr := strings.TrimSpace(parts[1])
				// Extract first number
				var buf strings.Builder
				for _, r := range numStr {
					if (r >= '0' && r <= '9') || r == '.' {
						buf.WriteRune(r)
					} else if buf.Len() > 0 {
						break
					}
				}
				if n, err := strconv.ParseFloat(buf.String(), 64); err == nil {
					if n > maxScore {
						n = maxScore
					}
					suggestedScore = n
				}
			}
			continue
		}

		if strings.HasPrefix(trimmed, "ПІКІР:") {
			inFeedback = true
			rest := strings.TrimSpace(strings.TrimPrefix(trimmed, "ПІКІР:"))
			if rest != "" {
				feedbackLines = append(feedbackLines, rest)
			}
			continue
		}

		if inFeedback {
			feedbackLines = append(feedbackLines, line)
		}
	}

	feedback := strings.TrimSpace(strings.Join(feedbackLines, "\n"))
	if feedback == "" {
		// Fallback: жауаптың өзін пікір ретінде қайтар
		feedback = response
	}

	return suggestedScore, feedback
}
