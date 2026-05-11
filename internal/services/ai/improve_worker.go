package ai

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"rest-project/internal/services/queue"
)

// ImprovePayload — кіріс.
type ImprovePayload struct {
	SubmissionText string `json:"submission_text"`
	AssignmentName string `json:"assignment_name,omitempty"`
	CurrentFeedback string `json:"current_feedback,omitempty"`
	Language       string `json:"language,omitempty"`
}

// ImproveResult — нәтиже.
type ImproveResult struct {
	Strengths    []string `json:"strengths"`
	Weaknesses   []string `json:"weaknesses"`
	Suggestions  []string `json:"suggestions"`
	Examples     []string `json:"examples,omitempty"`
	Tone         string   `json:"tone,omitempty"`        // overall tone
	OverallScore int      `json:"overall_score,omitempty"` // 0-100 эвристикалық бағалау
}

func MakeImproveHandler(client *OpenRouterClient) queue.Handler {
	return func(ctx context.Context, job *queue.Job, progress func(int)) (any, error) {
		if client == nil {
			return nil, errors.New("openrouter client disabled")
		}
		var p ImprovePayload
		if err := json.Unmarshal(job.Payload, &p); err != nil {
			return nil, fmt.Errorf("invalid payload: %w", err)
		}
		if strings.TrimSpace(p.SubmissionText) == "" {
			return nil, errors.New("submission_text is required")
		}
		if p.Language == "" {
			p.Language = "ru"
		}
		progress(20)

		msgs := buildImproveMessages(p)
		raw, err := client.Chat(ctx, msgs)
		if err != nil {
			return nil, err
		}
		progress(80)

		clean := extractJSON(raw)
		var result ImproveResult
		if err := json.Unmarshal([]byte(clean), &result); err != nil {
			return nil, fmt.Errorf("model returned non-JSON: %w (raw: %s)", err, truncate(raw, 200))
		}
		if result.OverallScore < 0 {
			result.OverallScore = 0
		}
		if result.OverallScore > 100 {
			result.OverallScore = 100
		}
		progress(100)
		return &result, nil
	}
}

func buildImproveMessages(p ImprovePayload) []Message {
	var lang string
	switch p.Language {
	case "kk":
		lang = "Kazakh"
	case "en":
		lang = "English"
	default:
		lang = "Russian"
	}

	sys := strings.Join([]string{
		"You are a constructive writing coach helping students improve their work.",
		"You give specific, actionable, kind feedback. You DO NOT rewrite the work for them.",
		"Return STRICT JSON:",
		`{"strengths":["..."],"weaknesses":["..."],"suggestions":["..."],"examples":["..."],"tone":"...","overall_score":0}`,
		"Each list must contain 2-5 items, each item is 1-2 sentences.",
		"All text in " + lang + ".",
	}, " ")

	user := fmt.Sprintf(
		"Assignment: %s\nCurrent feedback (if any): %s\n\nStudent submission:\n%s\n\nReply with JSON only.",
		fallback(p.AssignmentName, "не указан"),
		fallback(p.CurrentFeedback, "none"),
		p.SubmissionText,
	)
	return []Message{
		{Role: "system", Content: sys},
		{Role: "user", Content: user},
	}
}
