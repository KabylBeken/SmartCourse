package models

import (
	"time"
	"gorm.io/gorm"
)

type Course struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Title       string         `gorm:"not null" json:"title"`
	Description string         `json:"description"`
	TeacherID   uint           `json:"teacher_id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	
	// Связи
	Teacher     *User          `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	Students    []*User        `gorm:"many2many:course_students;" json:"students,omitempty"`
	Assignments []*Assignment  `json:"assignments,omitempty"`
} 