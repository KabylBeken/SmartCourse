package ai

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"rest-project/internal/services/queue"
)

// EvaluatePayload — вход для задачи AI-оценивания.
type EvaluatePayload struct {
	SubmissionText string                 `json:"submission_text"`
	AssignmentName string                 `json:"assignment_name,omitempty"`
	Criteria       []EvaluateCriterion    `json:"criteria"`
	Extra          map[string]interface{} `json:"extra,omitempty"`
}

type EvaluateCriterion struct {
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	MaxScore    int    `json:"max_score"`
	Prompt      string `json:"prompt,omitempty"`
}

type CriterionResult struct {
	Name     string `json:"name"`
	Score    int    `json:"score"`
	MaxScore int    `json:"max_score"`
	Feedback string `json:"feedback"`
}

type EvaluateResult struct {
	Total          int               `json:"total"`
	Max            int               `json:"max"`
	OverallFeedback string           `json:"overall_feedback"`
	Criteria       []CriterionResult `json:"criteria"`
}

// MakeEvaluateHandler — фабрика обработчика для воркера очереди.
// Возвращает queue.Handler, готовый к worker.Register("ai_evaluate", h).
func MakeEvaluateHandler(client *OpenRouterClient) queue.Handler {
	return func(ctx context.Context, job *queue.Job, progress func(int)) (any, error) {
		if client == nil {
			return nil, errors.New("openrouter client disabled (OPENROUTER_API_KEY missing)")
		}
		var p EvaluatePayload
		if err := json.Unmarshal(job.Payload, &p); err != nil {
			return nil, fmt.Errorf("invalid payload: %w", err)
		}
		if strings.TrimSpace(p.SubmissionText) == "" {
			return nil, errors.New("submission_text is empty")
		}
		if len(p.Criteria) == 0 {
			return nil, errors.New("criteria are required")
		}

		progress(15)
		messages := buildEvaluateMessages(p)
		progress(35)

		raw, err := client.Chat(ctx, messages)
		if err != nil {
			return nil, err
		}
		progress(80)

		result, err := parseEvaluateJSON(raw, p.Criteria)
		if err != nil {
			return nil, err
		}
		progress(100)
		return result, nil
	}
}

func buildEvaluateMessages(p EvaluatePayload) []Message {
	var sb strings.Builder
	sb.WriteString("You are a strict but fair grading assistant. ")
	sb.WriteString("Evaluate a student's submission against given criteria. ")
	sb.WriteString("Return STRICT JSON of the schema:\n")
	sb.WriteString(`{"criteria":[{"name":"...","score":0,"max_score":0,"feedback":"..."}],"overall_feedback":"..."}`)
	sb.WriteString("\nDo not include any extra text outside JSON.")

	criteriaJSON, _ := json.MarshalIndent(p.Criteria, "", "  ")
	user := fmt.Sprintf(
		"Assignment: %s\n\nCriteria:\n%s\n\nSubmission:\n%s\n\nReply with JSON only.",
		p.AssignmentName, string(criteriaJSON), p.SubmissionText,
	)
	return []Message{
		{Role: "system", Content: sb.String()},
		{Role: "user", Content: user},
	}
}

var jsonBlockRe = regexp.MustCompile(`(?s)\{.*\}`)

func parseEvaluateJSON(raw string, criteria []EvaluateCriterion) (*EvaluateResult, error) {
	// Срезаем код-блоки и markdown
	clean := strings.TrimSpace(raw)
	clean = strings.TrimPrefix(clean, "```json")
	clean = strings.TrimPrefix(clean, "```")
	clean = strings.TrimSuffix(clean, "```")
	if m := jsonBlockRe.FindString(clean); m != "" {
		clean = m
	}

	var data struct {
		Criteria        []CriterionResult `json:"criteria"`
		OverallFeedback string            `json:"overall_feedback"`
	}
	if err := json.Unmarshal([]byte(clean), &data); err != nil {
		return nil, fmt.Errorf("model returned non-JSON: %w (raw: %s)", err, truncate(raw, 200))
	}

	// Гарантируем порядок и max_score из заявленных критериев
	maxByName := map[string]int{}
	for _, c := range criteria {
		maxByName[c.Name] = c.MaxScore
	}
	total, max := 0, 0
	for i := range data.Criteria {
		if m, ok := maxByName[data.Criteria[i].Name]; ok {
			data.Criteria[i].MaxScore = m
		}
		if data.Criteria[i].Score > data.Criteria[i].MaxScore {
			data.Criteria[i].Score = data.Criteria[i].MaxScore
		}
		if data.Criteria[i].Score < 0 {
			data.Criteria[i].Score = 0
		}
		total += data.Criteria[i].Score
		max += data.Criteria[i].MaxScore
	}
	for _, c := range criteria {
		if max == 0 {
			max += c.MaxScore
		}
	}
	return &EvaluateResult{
		Total:           total,
		Max:             max,
		OverallFeedback: data.OverallFeedback,
		Criteria:        data.Criteria,
	}, nil
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "…"
}
