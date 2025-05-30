package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// EventType представляет тип события
type EventType string

const (
	EventTypeUserLogin     EventType = "USER_LOGIN"
	EventTypeUserRegistration EventType = "USER_REGISTRATION"
	EventTypeCourseCreated   EventType = "COURSE_CREATED"
	EventTypeAssignmentSubmitted EventType = "ASSIGNMENT_SUBMITTED"
	EventTypeGradeAdded     EventType = "GRADE_ADDED"
	
	// События для заданий
	EventAssignmentCreated EventType = "ASSIGNMENT_CREATED"
	EventAssignmentUpdated EventType = "ASSIGNMENT_UPDATED"
	EventAssignmentDeleted EventType = "ASSIGNMENT_DELETED"
	
	// События для оценок
	EventGradeCreated EventType = "GRADE_CREATED"
	EventGradeUpdated EventType = "GRADE_UPDATED"
	EventGradeDeleted EventType = "GRADE_DELETED"
)

// Event представляет собой структуру для событий в MongoDB
type Event struct {
	ID          primitive.ObjectID `bson:"_id,omitempty"`
	Type        EventType          `bson:"type"`
	UserID      uint               `bson:"user_id,omitempty"`
	ResourceID  string             `bson:"resource_id,omitempty"`
	ResourceType string            `bson:"resource_type,omitempty"`
	Data        map[string]any     `bson:"data,omitempty"`
	IPAddress   string             `bson:"ip_address,omitempty"`
	UserAgent   string             `bson:"user_agent,omitempty"`
	Timestamp   time.Time          `bson:"timestamp"`
} 