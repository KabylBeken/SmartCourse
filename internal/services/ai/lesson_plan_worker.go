package ai

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"rest-project/internal/services/queue"
)

// LessonPlanPayload — кіріс.
type LessonPlanPayload struct {
	Topic        string `json:"topic"`
	GradeLevel   string `json:"grade_level,omitempty"`   // мысалы "10 класс"
	Duration     int    `json:"duration,omitempty"`      // минут
	BloomLevel   string `json:"bloom_level,omitempty"`   // remember/understand/apply/analyze/evaluate/create
	Language     string `json:"language,omitempty"`      // "ru"|"kk"|"en"
}

// LessonPlanResult — нәтиже.
type LessonPlanResult struct {
	Title       string         `json:"title"`
	Objectives  []string       `json:"objectives"`
	Outline     []LessonStep   `json:"outline"`
	Materials   []string       `json:"materials,omitempty"`
	Assessment  string         `json:"assessment,omitempty"`
	Homework    string         `json:"homework,omitempty"`
	Reflection  string         `json:"reflection,omitempty"`
}

type LessonStep struct {
	Stage    string `json:"stage"`    // intro/explain/practice/check/closure
	Duration int    `json:"duration"` // минут
	Activity string `json:"activity"`
}

// MakeLessonPlanHandler — queue handler.
func MakeLessonPlanHandler(client *OpenRouterClient) queue.Handler {
	return func(ctx context.Context, job *queue.Job, progress func(int)) (any, error) {
		if client == nil {
			return nil, errors.New("openrouter client disabled")
		}
		var p LessonPlanPayload
		if err := json.Unmarshal(job.Payload, &p); err != nil {
			return nil, fmt.Errorf("invalid payload: %w", err)
		}
		if strings.TrimSpace(p.Topic) == "" {
			return nil, errors.New("topic is required")
		}
		if p.Language == "" {
			p.Language = "ru"
		}
		if p.Duration <= 0 {
			p.Duration = 45
		}
		progress(20)

		msgs := buildLessonPlanMessages(p)
		raw, err := client.Chat(ctx, msgs)
		if err != nil {
			return nil, err
		}
		progress(80)

		clean := extractJSON(raw)
		var result LessonPlanResult
		if err := json.Unmarshal([]byte(clean), &result); err != nil {
			return nil, fmt.Errorf("model returned non-JSON: %w (raw: %s)", err, truncate(raw, 200))
		}
		progress(100)
		return &result, nil
	}
}

func buildLessonPlanMessages(p LessonPlanPayload) []Message {
	var langName string
	switch p.Language {
	case "kk":
		langName = "Kazakh"
	case "en":
		langName = "English"
	default:
		langName = "Russian"
	}

	sys := strings.Join([]string{
		"You are an experienced curriculum designer. Generate a structured lesson plan based on Bloom's Taxonomy.",
		"Return STRICT JSON with this schema, no extra text, no markdown:",
		`{"title":"...","objectives":["...","..."],"outline":[{"stage":"intro|explain|practice|check|closure","duration":10,"activity":"..."}],"materials":["..."],"assessment":"...","homework":"...","reflection":"..."}`,
		"All texts must be written in " + langName + ".",
		"objectives = 3-6 measurable goals (action verbs).",
		"outline duration sum must approximately match the requested total duration.",
	}, " ")

	user := fmt.Sprintf(
		"Topic: %s\nGrade level: %s\nTotal duration: %d minutes\nFocus Bloom level: %s\nLanguage: %s\n\nReply with JSON only.",
		p.Topic, fallback(p.GradeLevel, "не указан"), p.Duration, fallback(p.BloomLevel, "balanced mix"), langName,
	)

	return []Message{
		{Role: "system", Content: sys},
		{Role: "user", Content: user},
	}
}

func fallback(s, def string) string {
	if strings.TrimSpace(s) == "" {
		return def
	}
	return s
}
