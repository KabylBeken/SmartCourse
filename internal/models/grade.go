package models

import (
	"time"
	"gorm.io/gorm"
)

type Grade struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	StudentID    uint           `json:"student_id"`
	AssignmentID uint           `json:"assignment_id"`
	Score        float64        `json:"score"`
	Feedback     string         `json:"feedback"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	
	// Связи
	Student      *User          `json:"student,omitempty"`
	Assignment   *Assignment    `json:"assignment,omitempty"`
} 