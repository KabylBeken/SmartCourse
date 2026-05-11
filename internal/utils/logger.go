package utils

import "log"

// WriteLog logs a message to stdout
func WriteLog(userID uint, component, message string, logType string) {
	log.Printf("[%s] [%s] UserID:%d %s", logType, component, userID, message)
}

// WriteInfoLog записывает информационный лог
func WriteInfoLog(userID uint, component, message string) {
	WriteLog(userID, component, message, "INFO")
}

// WriteWarningLog записывает предупреждающий лог
func WriteWarningLog(userID uint, component, message string) {
	WriteLog(userID, component, message, "WARNING")
}

// WriteErrorLog записывает лог об ошибке
func WriteErrorLog(userID uint, component, message string) {
	WriteLog(userID, component, message, "ERROR")
}

// LogAction записывает действие пользователя
func LogAction(userID uint, action, resource string, resourceID uint) {
	log.Printf("[INFO] [API] UserID:%d %s %s ID:%d", userID, action, resource, resourceID)
}

// LogLogin записывает событие входа пользователя
func LogLogin(userID uint, ipAddress, userAgent string) {
	log.Printf("[INFO] [Auth] UserID:%d Login from %s", userID, ipAddress)
}

// LogRegistration записывает событие регистрации пользователя
func LogRegistration(userID uint, ipAddress, userAgent string) {
	log.Printf("[INFO] [Auth] UserID:%d Registration from %s", userID, ipAddress)
}

// LogCourseCreated записывает событие создания курса
func LogCourseCreated(userID uint, courseID string, courseName string, ipAddress, userAgent string) {
	log.Printf("[INFO] [Courses] UserID:%d Course created: %s (ID:%s)", userID, courseName, courseID)
}

// LogCourseDeleted записывает событие удаления курса
func LogCourseDeleted(userID uint, courseID string, courseName string, ipAddress, userAgent string) {
	log.Printf("[INFO] [Courses] UserID:%d Course deleted: %s (ID:%s)", userID, courseName, courseID)
}

// LogAssignmentSubmitted записывает событие отправки задания
func LogAssignmentSubmitted(userID uint, assignmentID string, courseID string, ipAddress, userAgent string) {
	log.Printf("[INFO] [Assignments] UserID:%d Assignment submitted: ID:%s CourseID:%s", userID, assignmentID, courseID)
}

// LogGradeAdded записывает событие добавления оценки
func LogGradeAdded(userID uint, studentID uint, assignmentID string, grade float64, ipAddress, userAgent string) {
	log.Printf("[INFO] [Grades] UserID:%d Grade added: StudentID:%d AssignmentID:%s Grade:%.2f", userID, studentID, assignmentID, grade)
}

// RecordRequestDuration записывает длительность запроса
func RecordRequestDuration(endpoint string, method string, duration float64) {
	log.Printf("[METRIC] %s %s %.4fs", method, endpoint, duration)
}

// IncrementCounter — заглушка без MongoDB
func IncrementCounter(name string, labels map[string]string) {}

// SetGauge — заглушка без MongoDB
func SetGauge(name string, value float64, labels map[string]string) {}
