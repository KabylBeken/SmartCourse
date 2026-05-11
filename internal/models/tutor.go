package models

import "time"

type TutorSession struct {
	ID           uint      `gorm:"primaryKey"      json:"id"`
	StudentID    uint      `gorm:"not null;index"  json:"student_id"`
	AssignmentID uint      `gorm:"not null;index"  json:"assignment_id"`
	CreatedAt    time.Time `                       json:"created_at"`

	Messages []TutorMessage `gorm:"foreignKey:SessionID" json:"messages,omitempty"`
}

type TutorMessage struct {
	ID        uint      `gorm:"primaryKey"     json:"id"`
	SessionID uint      `gorm:"not null;index" json:"session_id"`
	Role      string    `gorm:"size:20"        json:"role"`
	Content   string    `gorm:"type:text"      json:"content"`
	CreatedAt time.Time `                      json:"created_at"`
}

type TutorChatRequest struct {
	Content string `json:"content" binding:"required"`
}

type TutorSessionResponse struct {
	Session  TutorSession   `json:"session"`
	Messages []TutorMessage `json:"messages"`
}
