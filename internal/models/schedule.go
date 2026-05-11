package models

import "time"

// ScheduleEventType — кесте оқиға түрі
type ScheduleEventType string

const (
	ScheduleLesson   ScheduleEventType = "lesson"
	ScheduleDeadline ScheduleEventType = "deadline"
	ScheduleExam     ScheduleEventType = "exam"
	ScheduleHoliday  ScheduleEventType = "holiday"
	ScheduleMeeting  ScheduleEventType = "meeting"
	ScheduleOther    ScheduleEventType = "other"
)

type ScheduleEvent struct {
	ID           uint           `gorm:"primaryKey"                     json:"id"`
	TeacherID    uint           `gorm:"not null;index"                 json:"teacher_id"`
	CourseID     *uint          `gorm:"index"                          json:"course_id,omitempty"`
	AssignmentID *uint          `gorm:"index"                          json:"assignment_id,omitempty"`
	Title        string         `gorm:"size:255;not null"              json:"title"`
	Description  string         `gorm:"type:text;default:''"           json:"description"`
	StartTime    time.Time      `gorm:"not null"                       json:"start"`
	EndTime      *time.Time     `                                      json:"end,omitempty"`
	AllDay       bool           `gorm:"default:false"                  json:"all_day"`
	Type         ScheduleEventType `gorm:"size:50;default:'lesson'"     json:"type"`
	Color        string         `gorm:"size:20;default:''"             json:"color"`
	CreatedAt    time.Time      `                                      json:"created_at"`
	UpdatedAt    time.Time      `                                      json:"updated_at"`
}

type CreateScheduleEventRequest struct {
	CourseID     *uint             `json:"course_id"`
	AssignmentID *uint             `json:"assignment_id"`
	Title        string            `json:"title" binding:"required"`
	Description  string            `json:"description"`
	Start        string            `json:"start" binding:"required"`
	End          string            `json:"end"`
	AllDay       bool              `json:"all_day"`
	Type         ScheduleEventType `json:"type"`
	Color        string            `json:"color"`
}

type UpdateScheduleEventRequest struct {
	Title       *string            `json:"title"`
	Description *string            `json:"description"`
	Start       *string            `json:"start"`
	End         *string            `json:"end"`
	AllDay      *bool              `json:"all_day"`
	Type        *ScheduleEventType `json:"type"`
	Color       *string            `json:"color"`
	CourseID    *uint              `json:"course_id"`
}
