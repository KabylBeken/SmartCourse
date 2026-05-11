package models

import (
	"time"

	"gorm.io/gorm"
)

// AssignmentType — тип тапсырма
type AssignmentType string

const (
	AssignmentTypeEssay AssignmentType = "essay"
	AssignmentTypeTest  AssignmentType = "test"
)

// EssayCriterion — эссе критерийі
type EssayCriterion struct {
	ID            int     `json:"id,omitempty"`
	Name          string  `json:"name"`
	MaxPoints     int     `json:"maxPoints"`
	MaxScore      int     `json:"max_score,omitempty"`
	Description   string  `json:"description"`
	Weight        float64 `json:"weight,omitempty"`
	AutoCheckable bool    `json:"auto_checkable,omitempty"`
	CheckPrompt   string  `json:"check_prompt,omitempty"`
	OrderIndex    int     `json:"order_index,omitempty"`
}

// TestQuestion — тест сұрағы
type TestQuestion struct {
	ID           int      `json:"id"`
	Question     string   `json:"question"`
	Options      []string `json:"options"`
	CorrectIndex int      `json:"correctIndex"` // -1 дегені студентке жасырылған
	Explanation  string   `json:"explanation,omitempty"` // бағалаудан кейін көрсетіледі; тапсырма GET-те жасырылады
}

// Assignment — тапсырма моделі
type Assignment struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Title       string         `gorm:"not null" json:"title"`
	Description string         `json:"description"`
	CourseID    uint           `json:"course_id"`
	DueDate     time.Time      `json:"due_date"`
	MaxScore    float64        `gorm:"default:100" json:"max_score"`
	Type        string         `gorm:"default:'essay'" json:"type"`
	Criteria    string         `gorm:"type:text" json:"-"` // JSON string — сервисте парсталады
	Questions   string         `gorm:"type:text" json:"-"` // JSON string — сервисте парсталады
	WordCount   int            `gorm:"default:0" json:"word_count"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Байланыстар
	Course *Course  `json:"course,omitempty"`
	Grades []*Grade `json:"grades,omitempty"`
}

// AssignmentResponse — API жауабы (criteria/questions парсталған)
type AssignmentResponse struct {
	ID          uint             `json:"id"`
	Title       string           `json:"title"`
	Description string           `json:"description"`
	CourseID    uint             `json:"course_id"`
	DueDate     time.Time        `json:"due_date"`
	MaxScore    float64          `json:"max_score"`
	Type        string           `json:"type"`
	WordCount   int              `json:"word_count,omitempty"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	Criteria    []EssayCriterion `json:"criteria,omitempty"`
	Questions   []TestQuestion   `json:"questions,omitempty"` // student-та correctIndex=-1
}
