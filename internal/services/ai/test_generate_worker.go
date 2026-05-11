package ai

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"rest-project/internal/services/queue"
)

// TestGeneratePayload — кіріс.
type TestGeneratePayload struct {
	Topic      string `json:"topic"`
	Count      int    `json:"count"`      // 5-30
	Difficulty string `json:"difficulty"` // easy|medium|hard|mixed
	Language   string `json:"language"`
}

// TestGenerateResult — нәтиже.
type TestGenerateResult struct {
	Topic     string         `json:"topic"`
	Questions []TestMCQ      `json:"questions"`
}

type TestMCQ struct {
	Question     string   `json:"question"`
	Options      []string `json:"options"` // 4 нұсқа
	CorrectIndex int      `json:"correct_index"`
	Explanation  string   `json:"explanation,omitempty"`
	Difficulty   string   `json:"difficulty,omitempty"`
}

func MakeTestGenerateHandler(client *OpenRouterClient) queue.Handler {
	return func(ctx context.Context, job *queue.Job, progress func(int)) (any, error) {
		if client == nil {
			return nil, errors.New("openrouter client disabled")
		}
		var p TestGeneratePayload
		if err := json.Unmarshal(job.Payload, &p); err != nil {
			return nil, fmt.Errorf("invalid payload: %w", err)
		}
		if strings.TrimSpace(p.Topic) == "" {
			return nil, errors.New("topic is required")
		}
		if p.Count <= 0 {
			p.Count = 10
		}
		if p.Count > 30 {
			p.Count = 30
		}
		if p.Difficulty == "" {
			p.Difficulty = "mixed"
		}
		if p.Language == "" {
			p.Language = "ru"
		}
		progress(20)

		msgs := buildTestMessages(p)
		raw, err := client.Chat(ctx, msgs)
		if err != nil {
			return nil, err
		}
		progress(80)

		clean := extractJSON(raw)
		var result TestGenerateResult
		if err := json.Unmarshal([]byte(clean), &result); err != nil {
			return nil, fmt.Errorf("model returned non-JSON: %w (raw: %s)", err, truncate(raw, 200))
		}
		// Sanity validation
		for i := range result.Questions {
			if len(result.Questions[i].Options) != 4 {
				return nil, fmt.Errorf("question %d must have exactly 4 options", i+1)
			}
			if result.Questions[i].CorrectIndex < 0 || result.Questions[i].CorrectIndex > 3 {
				result.Questions[i].CorrectIndex = 0
			}
		}
		if result.Topic == "" {
			result.Topic = p.Topic
		}
		progress(100)
		return &result, nil
	}
}

func buildTestMessages(p TestGeneratePayload) []Message {
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
		"You are a senior teacher generating multiple-choice questions.",
		"Return STRICT JSON, no extra text:",
		`{"topic":"...","questions":[{"question":"...","options":["A","B","C","D"],"correct_index":0,"explanation":"...","difficulty":"easy|medium|hard"}]}`,
		"Each question must have EXACTLY 4 options. Exactly one correct answer.",
		"Distractors must be plausible but wrong. Explanation = 1-2 sentences.",
		"All text in " + lang + ".",
	}, " ")

	user := fmt.Sprintf(
		"Topic: %s\nNumber of questions: %d\nDifficulty: %s\nLanguage: %s\n\nReply with JSON only.",
		p.Topic, p.Count, p.Difficulty, lang,
	)
	return []Message{
		{Role: "system", Content: sys},
		{Role: "user", Content: user},
	}
}
