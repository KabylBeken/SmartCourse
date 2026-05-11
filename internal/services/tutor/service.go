package tutor

import (
	"context"
	"fmt"
	"strings"

	"gorm.io/gorm"

	"rest-project/internal/models"
	"rest-project/internal/services/ai"
)

type Service struct {
	db     *gorm.DB
	client *ai.OpenRouterClient
}

func NewService(db *gorm.DB, client *ai.OpenRouterClient) *Service {
	return &Service{db: db, client: client}
}

// GetOrCreate — student + assignment бойынша session алу немесе жасау
func (s *Service) GetOrCreate(studentID, assignmentID uint) (*models.TutorSession, error) {
	var session models.TutorSession
	err := s.db.Where("student_id = ? AND assignment_id = ?", studentID, assignmentID).
		First(&session).Error
	if err == gorm.ErrRecordNotFound {
		session = models.TutorSession{
			StudentID:    studentID,
			AssignmentID: assignmentID,
		}
		if err2 := s.db.Create(&session).Error; err2 != nil {
			return nil, err2
		}
	} else if err != nil {
		return nil, err
	}
	return &session, nil
}

// GetMessages — session хабарламаларын алу
func (s *Service) GetMessages(sessionID uint) ([]models.TutorMessage, error) {
	var msgs []models.TutorMessage
	err := s.db.Where("session_id = ?", sessionID).
		Order("created_at ASC").
		Find(&msgs).Error
	return msgs, err
}

// SaveMessage — хабарлама сақтау
func (s *Service) SaveMessage(sessionID uint, role, content string) (*models.TutorMessage, error) {
	msg := &models.TutorMessage{
		SessionID: sessionID,
		Role:      role,
		Content:   content,
	}
	return msg, s.db.Create(msg).Error
}

// ClearHistory — session хабарламаларын жою
func (s *Service) ClearHistory(studentID, assignmentID uint) error {
	var session models.TutorSession
	if err := s.db.Where("student_id = ? AND assignment_id = ?", studentID, assignmentID).
		First(&session).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil
		}
		return err
	}
	return s.db.Exec("DELETE FROM tutor_messages WHERE session_id = ?", session.ID).Error
}

// BuildMessages — system prompt + тарих + жаңа user хабарлама
func (s *Service) BuildMessages(assignmentID uint, history []models.TutorMessage, userContent string) ([]ai.Message, error) {
	type assignRow struct {
		Title       string
		Description string
	}
	var row assignRow
	s.db.Raw("SELECT title, description FROM assignments WHERE id = ?", assignmentID).Scan(&row)

	sysParts := []string{
		"You are a helpful AI tutor for students.",
		"Your role is to GUIDE and EXPLAIN — never give direct answers to assignment questions.",
		"Ask leading questions, provide hints, explain concepts related to the topic.",
		"Be encouraging and patient.",
		"Respond in the same language the student uses (Kazakh, Russian, or English).",
	}
	if row.Title != "" {
		sysParts = append(sysParts,
			fmt.Sprintf("The student is working on assignment: \"%s\".", row.Title),
		)
	}
	if row.Description != "" {
		short := row.Description
		if len(short) > 500 {
			short = short[:500] + "..."
		}
		sysParts = append(sysParts,
			fmt.Sprintf("Assignment description: %s", short),
		)
	}
	sysParts = append(sysParts, "IMPORTANT: Do NOT write the answer for the student. Only guide them.")

	msgs := []ai.Message{
		{Role: "system", Content: strings.Join(sysParts, " ")},
	}
	for _, h := range history {
		msgs = append(msgs, ai.Message{Role: h.Role, Content: h.Content})
	}
	msgs = append(msgs, ai.Message{Role: "user", Content: userContent})
	return msgs, nil
}

// Stream — OpenRouter SSE stream → ch арналы арқылы delta жіберу
func (s *Service) Stream(ctx context.Context, msgs []ai.Message, ch chan<- string) error {
	if s.client == nil {
		ch <- "AI қызметі өшірілген (OPENROUTER_API_KEY жоқ)"
		return nil
	}
	return s.client.ChatStream(ctx, msgs, ch)
}
