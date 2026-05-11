package models

import (
	"time"

	"gorm.io/gorm"
)

const (
	SubmissionStatusDraft     = "draft"
	SubmissionStatusSubmitted = "submitted"
	SubmissionStatusLate      = "late"
	SubmissionStatusGraded    = "graded"
)

type TestAnswer struct {
	QuestionID    int `json:"question_id"`
	SelectedIndex int `json:"selected_index"`
}

// TestQuestionReview — студентке бағаланған тест нәтижесі (сұрақ бойынша)
type TestQuestionReview struct {
	QuestionID    int     `json:"question_id"`
	SelectedIndex int     `json:"selected_index"` // жауап жоқ болса -1
	CorrectIndex  int     `json:"correct_index"`
	IsCorrect     bool    `json:"is_correct"`
	Explanation   string  `json:"explanation,omitempty"`
	PointsEarned  float64 `json:"points_earned"`
	PointsMax     float64 `json:"points_max"`
}

type AssignmentSubmission struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	StudentID    uint           `gorm:"not null;uniqueIndex:idx_assignment_submission_student_assignment" json:"student_id"`
	AssignmentID uint           `gorm:"not null;uniqueIndex:idx_assignment_submission_student_assignment" json:"assignment_id"`
	Content      string         `gorm:"type:text" json:"content"`
	Answers      string         `gorm:"type:text" json:"-"`
	Status       string         `gorm:"not null;default:'draft'" json:"status"`
	WordCount    int            `gorm:"not null;default:0" json:"word_count"`
	SubmittedAt  *time.Time     `json:"submitted_at,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	Student    *User       `json:"student,omitempty"`
	Assignment *Assignment `json:"assignment,omitempty"`
}

type AssignmentSubmissionResponse struct {
	ID           uint                 `json:"id"`
	StudentID    uint                 `json:"student_id"`
	AssignmentID uint                 `json:"assignment_id"`
	Content      string               `json:"content"`
	Answers      []TestAnswer         `json:"answers,omitempty"`
	Status       string               `json:"status"`
	WordCount    int                  `json:"word_count"`
	SubmittedAt  *time.Time           `json:"submitted_at,omitempty"`
	CreatedAt    time.Time            `json:"created_at"`
	UpdatedAt    time.Time            `json:"updated_at"`
	Grade        *Grade               `json:"grade,omitempty"`
	TestReview   []TestQuestionReview `json:"test_review,omitempty"`
}
