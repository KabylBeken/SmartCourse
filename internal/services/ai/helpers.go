package ai

import (
	"strings"
)

// extractJSON — LLM жауабынан таза JSON блогын алады.
// Markdown ```json...``` тегтерін кесіп, бірінші { бастап соңғы } аралықты қайтарады.
func extractJSON(raw string) string {
	clean := strings.TrimSpace(raw)
	clean = strings.TrimPrefix(clean, "```json")
	clean = strings.TrimPrefix(clean, "```")
	clean = strings.TrimSuffix(clean, "```")
	if m := jsonBlockRe.FindString(clean); m != "" {
		return m
	}
	return clean
}
