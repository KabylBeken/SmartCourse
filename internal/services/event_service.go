package services

import (
	"rest-project/internal/models"
	"rest-project/internal/repository"
)

type EventService struct {
	eventRepo *repository.EventRepository
}

func NewEventService(eventRepo *repository.EventRepository) *EventService {
	return &EventService{
		eventRepo: eventRepo,
	}
}

// RecordEvent записывает событие в систему
func (s *EventService) RecordEvent(eventType models.EventType, userID uint, resourceID string, resourceType string, data map[string]any, ipAddress, userAgent string) error {
	event := &models.Event{
		Type:         eventType,
		UserID:       userID,
		ResourceID:   resourceID,
		ResourceType: resourceType,
		Data:         data,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
	}
	
	return s.eventRepo.CreateEvent(event)
}

// RecordUserLoginEvent записывает событие входа пользователя
func (s *EventService) RecordUserLoginEvent(userID uint, ipAddress, userAgent string) error {
	return s.RecordEvent(
		models.EventTypeUserLogin,
		userID,
		"",
		"user",
		map[string]any{},
		ipAddress,
		userAgent,
	)
}

// RecordUserRegistrationEvent записывает событие регистрации пользователя
func (s *EventService) RecordUserRegistrationEvent(userID uint, ipAddress, userAgent string) error {
	return s.RecordEvent(
		models.EventTypeUserRegistration,
		userID,
		"",
		"user",
		map[string]any{},
		ipAddress,
		userAgent,
	)
}

// RecordCourseCreatedEvent записывает событие создания курса
func (s *EventService) RecordCourseCreatedEvent(userID uint, courseID string, courseName string, ipAddress, userAgent string) error {
	return s.RecordEvent(
		models.EventTypeCourseCreated,
		userID,
		courseID,
		"course",
		map[string]any{
			"course_name": courseName,
		},
		ipAddress,
		userAgent,
	)
}

// LogEvent простой метод для логирования событий без IP и User-Agent
func (s *EventService) LogEvent(eventType models.EventType, userID uint, data map[string]any) error {
	if s == nil {
		return nil // Безопасно обрабатываем случай, когда сервис не инициализирован
	}
	
	return s.RecordEvent(
		eventType,
		userID,
		"", // без resourceID
		"", // без resourceType
		data,
		"", // без IP
		"", // без User-Agent
	)
}

// GetUserEvents получает события пользователя
func (s *EventService) GetUserEvents(userID uint, page, pageSize int64) ([]models.Event, int64, error) {
	skip := (page - 1) * pageSize
	events, err := s.eventRepo.GetUserEvents(userID, pageSize, skip)
	if err != nil {
		return nil, 0, err
	}
	
	// Подсчет общего количества событий для этого пользователя
	filter := map[string]any{"user_id": userID}
	total, err := s.eventRepo.CountEvents(filter)
	if err != nil {
		return nil, 0, err
	}
	
	return events, total, nil
}

// GetEvents получает события с фильтрацией и пагинацией
func (s *EventService) GetEvents(eventType models.EventType, resourceType string, page, pageSize int64) ([]models.Event, int64, error) {
	filter := make(map[string]any)
	
	if eventType != "" {
		filter["type"] = eventType
	}
	
	if resourceType != "" {
		filter["resource_type"] = resourceType
	}
	
	skip := (page - 1) * pageSize
	events, err := s.eventRepo.FindEvents(filter, pageSize, skip)
	if err != nil {
		return nil, 0, err
	}
	
	total, err := s.eventRepo.CountEvents(filter)
	if err != nil {
		return nil, 0, err
	}
	
	return events, total, nil
} 