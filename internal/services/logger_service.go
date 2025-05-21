package services

import (
	"rest-project/internal/models"
	"rest-project/internal/repository"
)

type LoggerService struct {
	logRepo *repository.LogRepository
}

func NewLoggerService(logRepo *repository.LogRepository) *LoggerService {
	return &LoggerService{
		logRepo: logRepo,
	}
}

// Info создает информационный лог
func (s *LoggerService) Info(component, message string, userID uint, metadata map[string]any) error {
	log := &models.Log{
		Type:      models.LogTypeInfo,
		Message:   message,
		UserID:    userID,
		Component: component,
		Metadata:  metadata,
	}
	
	return s.logRepo.CreateLog(log)
}

// Warning создает предупреждающий лог
func (s *LoggerService) Warning(component, message string, userID uint, metadata map[string]any) error {
	log := &models.Log{
		Type:      models.LogTypeWarning,
		Message:   message,
		UserID:    userID,
		Component: component,
		Metadata:  metadata,
	}
	
	return s.logRepo.CreateLog(log)
}

// Error создает лог об ошибке
func (s *LoggerService) Error(component, message string, userID uint, metadata map[string]any) error {
	log := &models.Log{
		Type:      models.LogTypeError,
		Message:   message,
		UserID:    userID,
		Component: component,
		Metadata:  metadata,
	}
	
	return s.logRepo.CreateLog(log)
}

// GetLogs получает логи с пагинацией
func (s *LoggerService) GetLogs(logType models.LogType, component string, page, pageSize int64) ([]models.Log, int64, error) {
	filter := make(map[string]any)
	
	if logType != "" {
		filter["type"] = logType
	}
	
	if component != "" {
		filter["component"] = component
	}
	
	skip := (page - 1) * pageSize
	logs, err := s.logRepo.FindLogs(filter, pageSize, skip)
	if err != nil {
		return nil, 0, err
	}
	
	total, err := s.logRepo.CountLogs(filter)
	if err != nil {
		return nil, 0, err
	}
	
	return logs, total, nil
} 