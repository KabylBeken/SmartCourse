package utils

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"rest-project/internal/db"
	"rest-project/internal/models"
)

// WriteLog записывает лог в MongoDB
func WriteLog(userID uint, component, message string, logType models.LogType) {
	if db.MongoDatabase == nil {
		log.Printf("MongoDB не инициализирована, лог не будет записан")
		return
	}

	logCollection := db.MongoDatabase.Collection("logs")
	
	logEntry := models.Log{
		ID:        primitive.NewObjectID(),
		Type:      logType,
		Message:   message,
		UserID:    userID,
		Component: component,
		CreatedAt: time.Now(),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := logCollection.InsertOne(ctx, logEntry)
	if err != nil {
		log.Printf("Ошибка записи лога: %v", err)
	} else {
		log.Printf("Лог успешно записан: [%s] %s", logType, message)
	}
}

// WriteInfoLog записывает информационный лог
func WriteInfoLog(userID uint, component, message string) {
	WriteLog(userID, component, message, models.LogTypeInfo)
}

// WriteWarningLog записывает предупреждающий лог
func WriteWarningLog(userID uint, component, message string) {
	WriteLog(userID, component, message, models.LogTypeWarning)
}

// WriteErrorLog записывает лог об ошибке
func WriteErrorLog(userID uint, component, message string) {
	WriteLog(userID, component, message, models.LogTypeError)
}

// LogAction записывает действие пользователя
func LogAction(userID uint, action, resource string, resourceID uint) {
	message := action + " " + resource + " ID:" + primitive.NewObjectID().Hex()
	component := "API"
	WriteInfoLog(userID, component, message)
}

// WriteEvent записывает событие в MongoDB
func WriteEvent(userID uint, eventType models.EventType, resourceID string, resourceType string, data map[string]any, ipAddress, userAgent string) {
	if db.MongoDatabase == nil {
		log.Printf("MongoDB не инициализирована, событие не будет записано")
		return
	}

	eventCollection := db.MongoDatabase.Collection("events")
	
	event := models.Event{
		ID:          primitive.NewObjectID(),
		Type:        eventType,
		UserID:      userID,
		ResourceID:  resourceID,
		ResourceType: resourceType,
		Data:        data,
		IPAddress:   ipAddress,
		UserAgent:   userAgent,
		Timestamp:   time.Now(),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := eventCollection.InsertOne(ctx, event)
	if err != nil {
		log.Printf("Ошибка записи события: %v", err)
	} else {
		log.Printf("Событие успешно записано: [%s] для пользователя ID:%d", eventType, userID)
	}
}

// LogLogin записывает событие входа пользователя
func LogLogin(userID uint, ipAddress, userAgent string) {
	WriteEvent(userID, models.EventTypeUserLogin, "", "user", nil, ipAddress, userAgent)
}

// LogRegistration записывает событие регистрации пользователя
func LogRegistration(userID uint, ipAddress, userAgent string) {
	WriteEvent(userID, models.EventTypeUserRegistration, "", "user", nil, ipAddress, userAgent)
}

// LogCourseCreated записывает событие создания курса
func LogCourseCreated(userID uint, courseID string, courseName string, ipAddress, userAgent string) {
	data := map[string]any{"course_name": courseName}
	WriteEvent(userID, models.EventTypeCourseCreated, courseID, "course", data, ipAddress, userAgent)
}

// LogCourseDeleted записывает событие удаления курса
func LogCourseDeleted(userID uint, courseID string, courseName string, ipAddress, userAgent string) {
	data := map[string]any{"course_name": courseName}
	WriteEvent(userID, "COURSE_DELETED", courseID, "course", data, ipAddress, userAgent)
}

// LogAssignmentSubmitted записывает событие отправки задания
func LogAssignmentSubmitted(userID uint, assignmentID string, courseID string, ipAddress, userAgent string) {
	data := map[string]any{"course_id": courseID}
	WriteEvent(userID, models.EventTypeAssignmentSubmitted, assignmentID, "assignment", data, ipAddress, userAgent)
}

// LogGradeAdded записывает событие добавления оценки
func LogGradeAdded(userID uint, studentID uint, assignmentID string, grade float64, ipAddress, userAgent string) {
	data := map[string]any{
		"student_id": studentID,
		"grade": grade,
	}
	WriteEvent(userID, models.EventTypeGradeAdded, assignmentID, "grade", data, ipAddress, userAgent)
}

// WriteMetric записывает метрику в MongoDB
func WriteMetric(name string, value float64, metricType models.MetricType, labels map[string]string) {
	if db.MongoDatabase == nil {
		log.Printf("MongoDB не инициализирована, метрика не будет записана")
		return
	}

	metricCollection := db.MongoDatabase.Collection("metrics")
	
	metric := models.Metric{
		ID:        primitive.NewObjectID(),
		Name:      name,
		Value:     value,
		Type:      metricType,
		Labels:    labels,
		Timestamp: time.Now(),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := metricCollection.InsertOne(ctx, metric)
	if err != nil {
		log.Printf("Ошибка записи метрики: %v", err)
	} else {
		log.Printf("Метрика успешно записана: [%s] %.2f", name, value)
	}
}

// RecordRequestDuration записывает длительность запроса
func RecordRequestDuration(endpoint string, method string, duration float64) {
	labels := map[string]string{
		"endpoint": endpoint,
		"method":   method,
	}
	WriteMetric("request_duration", duration, models.MetricTypeHistogram, labels)
}

// IncrementCounter увеличивает счетчик с заданным именем
func IncrementCounter(name string, labels map[string]string) {
	WriteMetric(name, 1.0, models.MetricTypeCounter, labels)
}

// SetGauge устанавливает значение gauge метрики
func SetGauge(name string, value float64, labels map[string]string) {
	WriteMetric(name, value, models.MetricTypeGauge, labels)
} 