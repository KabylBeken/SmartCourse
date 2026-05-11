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

type CourseStudentResponse struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

type CourseAssignmentResponse struct {
	ID       uint      `json:"id"`
	Title    string    `json:"title"`
	Type     string    `json:"type"`
	DueDate  time.Time `json:"due_date"`
	MaxScore float64   `json:"max_score"`
}

type CourseResponse struct {
	ID               uint                       `json:"id"`
	Title            string                     `json:"title"`
	Description      string                     `json:"description"`
	TeacherID        uint                       `json:"teacher_id"`
	StudentCount     int                        `json:"student_count"`
	AssignmentsCount int                        `json:"assignments_count"`
	Students         []CourseStudentResponse    `json:"students"`
	Assignments      []CourseAssignmentResponse `json:"assignments"`
	CreatedAt        time.Time                  `json:"created_at"`
	UpdatedAt        time.Time                  `json:"updated_at"`
}
