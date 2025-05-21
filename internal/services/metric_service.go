package services

import (
	"rest-project/internal/models"
	"rest-project/internal/repository"
)

type MetricService struct {
	metricRepo *repository.MetricRepository
}

func NewMetricService(metricRepo *repository.MetricRepository) *MetricService {
	return &MetricService{
		metricRepo: metricRepo,
	}
}

// IncrementCounter увеличивает счетчик метрики
func (s *MetricService) IncrementCounter(name string, labels map[string]string, value float64) error {
	return s.metricRepo.IncrementCounter(name, labels, value)
}

// SetGauge устанавливает значение gauge метрики
func (s *MetricService) SetGauge(name string, labels map[string]string, value float64) error {
	return s.metricRepo.SetGauge(name, labels, value)
}

// TrackRequestDuration отслеживает длительность запроса
func (s *MetricService) TrackRequestDuration(endpoint string, method string, duration float64) error {
	return s.metricRepo.CreateMetric(&models.Metric{
		Name:  "request_duration",
		Type:  models.MetricTypeHistogram,
		Value: duration,
		Labels: map[string]string{
			"endpoint": endpoint,
			"method":   method,
		},
	})
}

// TrackActiveUsers отслеживает активных пользователей
func (s *MetricService) TrackActiveUsers(count float64) error {
	return s.metricRepo.SetGauge("active_users", nil, count)
}

// TrackCourseCreation отслеживает создание курсов
func (s *MetricService) TrackCourseCreation() error {
	return s.metricRepo.IncrementCounter("course_created", nil, 1)
}

// TrackAssignmentSubmission отслеживает отправку заданий
func (s *MetricService) TrackAssignmentSubmission(courseID string) error {
	return s.metricRepo.IncrementCounter("assignment_submitted", map[string]string{
		"course_id": courseID,
	}, 1)
}

// GetMetrics получает метрики с фильтрацией и пагинацией
func (s *MetricService) GetMetrics(metricName string, metricType models.MetricType, page, pageSize int64) ([]models.Metric, int64, error) {
	filter := make(map[string]any)
	
	if metricName != "" {
		filter["name"] = metricName
	}
	
	if metricType != "" {
		filter["type"] = metricType
	}
	
	skip := (page - 1) * pageSize
	metrics, err := s.metricRepo.FindMetrics(filter, pageSize, skip)
	if err != nil {
		return nil, 0, err
	}
	
	total, err := s.metricRepo.CountMetrics(filter)
	if err != nil {
		return nil, 0, err
	}
	
	return metrics, total, nil
} 