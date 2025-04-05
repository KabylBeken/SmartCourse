package models

import (
	"time"
	"gorm.io/gorm"
)

type Assignment struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Title       string         `gorm:"not null" json:"title"`
	Description string         `json:"description"`
	CourseID    uint           `json:"course_id"`
	DueDate     time.Time      `json:"due_date"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	
	// Связи
	Course      *Course        `json:"course,omitempty"`
	Grades      []*Grade       `json:"grades,omitempty"`
} 