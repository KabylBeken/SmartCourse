package models

import "time"

// Attachment — файл, привязанный к assignment / submission / course (или просто библиотека).
type Attachment struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	OwnerID     uint      `json:"owner_id"`
	TargetType  string    `json:"target_type"` // "assignment" | "submission" | "course" | "free"
	TargetID    *uint     `json:"target_id,omitempty"`
	ObjectKey   string    `json:"object_key"`
	Filename    string    `json:"filename"`
	ContentType string    `json:"content_type"`
	SizeBytes   int64     `json:"size_bytes"`
	CreatedAt   time.Time `json:"created_at"`
}

func (Attachment) TableName() string { return "attachments" }
