package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// LogType представляет тип лога
type LogType string

const (
	LogTypeInfo    LogType = "INFO"
	LogTypeWarning LogType = "WARNING"
	LogTypeError   LogType = "ERROR"
)

// Log представляет собой структуру для логов в MongoDB
type Log struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	Type      LogType            `bson:"type"`
	Message   string             `bson:"message"`
	UserID    uint               `bson:"user_id,omitempty"`
	Component string             `bson:"component"`
	Metadata  map[string]any     `bson:"metadata,omitempty"`
	CreatedAt time.Time          `bson:"created_at"`
} 