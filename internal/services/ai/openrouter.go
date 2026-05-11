package ai

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// Message — формат OpenAI-совместимых чатов.
type Message struct {
	Role    string `json:"role"`    // "system" | "user" | "assistant"
	Content string `json:"content"`
}

type ChatRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"`
}

type chatResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// OpenRouterClient — простой синхронный клиент к OpenRouter chat completions.
type OpenRouterClient struct {
	apiKey string
	model  string
	http   *http.Client
}

// NewOpenRouterFromEnvSafe — returns nil (no panic) if key is missing.
func NewOpenRouterFromEnvSafe() *OpenRouterClient {
	c, _ := NewOpenRouterFromEnv()
	return c
}

func NewOpenRouterFromEnv() (*OpenRouterClient, error) {
	key := os.Getenv("OPENROUTER_API_KEY")
	if key == "" {
		return nil, errors.New("OPENROUTER_API_KEY is not set")
	}
	model := os.Getenv("OPENROUTER_MODEL")
	if model == "" {
		model = "openai/gpt-oss-120b:free"
	}
	return &OpenRouterClient{
		apiKey: key,
		model:  model,
		http:   &http.Client{Timeout: 60 * time.Second},
	}, nil
}

// Chat выполняет один синхронный запрос и возвращает ответ модели.
func (c *OpenRouterClient) Chat(ctx context.Context, messages []Message) (string, error) {
	if c == nil {
		return "", errors.New("openrouter client is nil")
	}
	body, err := json.Marshal(ChatRequest{
		Model:    c.model,
		Messages: messages,
	})
	if err != nil {
		return "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://openrouter.ai/api/v1/chat/completions",
		bytes.NewReader(body),
	)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("HTTP-Referer", "https://smartcourse.local")
	req.Header.Set("X-Title", "SmartCourse")

	resp, err := c.http.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("openrouter %d: %s", resp.StatusCode, string(raw))
	}
	var parsed chatResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return "", err
	}
	if parsed.Error != nil {
		return "", errors.New(parsed.Error.Message)
	}
	if len(parsed.Choices) == 0 {
		return "", errors.New("empty response")
	}
	return parsed.Choices[0].Message.Content, nil
}

// streamChunk — SSE delta формат.
type streamChunk struct {
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
}

// ChatStream — SSE streaming запрос. Дельталарды ch арналы арқылы жібереді.
// ch жабылғаннан кейін функция қайтарылады.
func (c *OpenRouterClient) ChatStream(ctx context.Context, messages []Message, ch chan<- string) error {
	if c == nil {
		return errors.New("openrouter client is nil")
	}
	body, err := json.Marshal(ChatRequest{
		Model:    c.model,
		Messages: messages,
		Stream:   true,
	})
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		"https://openrouter.ai/api/v1/chat/completions",
		bytes.NewReader(body),
	)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "text/event-stream")
	req.Header.Set("HTTP-Referer", "https://smartcourse.local")
	req.Header.Set("X-Title", "SmartCourse")

	streamClient := &http.Client{Timeout: 120 * time.Second}
	resp, err := streamClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		raw, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("openrouter stream %d: %s", resp.StatusCode, string(raw))
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		payload := strings.TrimPrefix(line, "data: ")
		if strings.TrimSpace(payload) == "[DONE]" {
			break
		}
		var chunk streamChunk
		if err := json.Unmarshal([]byte(payload), &chunk); err != nil {
			continue
		}
		if len(chunk.Choices) == 0 {
			continue
		}
		delta := chunk.Choices[0].Delta.Content
		if delta == "" {
			if chunk.Choices[0].FinishReason != "" {
				break
			}
			continue
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case ch <- delta:
		}
	}
	return scanner.Err()
}
