package schedule

import (
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"

	"rest-project/internal/models"
)

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

// parseTime — flexible ISO/RFC3339 string parser
func parseTime(s string) (time.Time, error) {
	formats := []string{
		time.RFC3339,
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04:05",
		"2006-01-02T15:04",
		"2006-01-02",
	}
	for _, f := range formats {
		if t, err := time.Parse(f, s); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("cannot parse time: %q", s)
}

// List — оқиғаларды кезең бойынша алу
func (s *Service) List(teacherID uint, start, end time.Time, courseID uint) ([]models.ScheduleEvent, error) {
	var events []models.ScheduleEvent
	q := s.db.Where("teacher_id = ?", teacherID)
	if !start.IsZero() {
		q = q.Where("start_time >= ?", start)
	}
	if !end.IsZero() {
		q = q.Where("start_time <= ?", end)
	}
	if courseID > 0 {
		q = q.Where("course_id = ?", courseID)
	}
	if err := q.Order("start_time ASC").Find(&events).Error; err != nil {
		return nil, err
	}
	return events, nil
}

// Create — жаңа оқиға жасау
func (s *Service) Create(teacherID uint, req models.CreateScheduleEventRequest) (*models.ScheduleEvent, error) {
	if req.Title == "" {
		return nil, errors.New("title is required")
	}
	start, err := parseTime(req.Start)
	if err != nil {
		return nil, fmt.Errorf("invalid start: %w", err)
	}
	ev := &models.ScheduleEvent{
		TeacherID:    teacherID,
		CourseID:     req.CourseID,
		AssignmentID: req.AssignmentID,
		Title:        req.Title,
		Description:  req.Description,
		StartTime:    start,
		AllDay:       req.AllDay,
		Type:         req.Type,
		Color:        req.Color,
	}
	if req.End != "" {
		if endT, err2 := parseTime(req.End); err2 == nil {
			ev.EndTime = &endT
		}
	}
	if ev.Type == "" {
		ev.Type = models.ScheduleLesson
	}
	if err := s.db.Create(ev).Error; err != nil {
		return nil, err
	}
	return ev, nil
}

// Update — drag-and-drop немесе толық өзгерту
func (s *Service) Update(teacherID, eventID uint, req models.UpdateScheduleEventRequest) (*models.ScheduleEvent, error) {
	var ev models.ScheduleEvent
	if err := s.db.Where("id = ? AND teacher_id = ?", eventID, teacherID).First(&ev).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("event not found")
		}
		return nil, err
	}
	if req.Title != nil {
		ev.Title = *req.Title
	}
	if req.Description != nil {
		ev.Description = *req.Description
	}
	if req.Start != nil {
		if t, err := parseTime(*req.Start); err == nil {
			ev.StartTime = t
		}
	}
	if req.End != nil {
		if *req.End == "" {
			ev.EndTime = nil
		} else if t, err := parseTime(*req.End); err == nil {
			ev.EndTime = &t
		}
	}
	if req.AllDay != nil {
		ev.AllDay = *req.AllDay
	}
	if req.Type != nil {
		ev.Type = *req.Type
	}
	if req.Color != nil {
		ev.Color = *req.Color
	}
	if req.CourseID != nil {
		ev.CourseID = req.CourseID
	}
	ev.UpdatedAt = time.Now()
	if err := s.db.Save(&ev).Error; err != nil {
		return nil, err
	}
	return &ev, nil
}

// Delete — hard delete
func (s *Service) Delete(teacherID, eventID uint) error {
	res := s.db.Exec("DELETE FROM schedule_events WHERE id = ? AND teacher_id = ?", eventID, teacherID)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("event not found")
	}
	return nil
}

// SyncDeadlines — тапсырма deadline-дарын автоматты Events-ке аудару
func (s *Service) SyncDeadlines(teacherID uint) (int, error) {
	type assignRow struct {
		ID       uint
		Title    string
		DueDate  time.Time
		CourseID uint
	}
	var rows []assignRow
	err := s.db.Raw(`
		SELECT a.id, a.title, a.due_date, a.course_id
		FROM assignments a
		JOIN courses c ON c.id = a.course_id
		WHERE c.teacher_id = ?
		  AND a.due_date IS NOT NULL
		  AND a.due_date > NOW()
	`, teacherID).Scan(&rows).Error
	if err != nil {
		return 0, err
	}

	created := 0
	for _, row := range rows {
		var cnt int64
		s.db.Model(&models.ScheduleEvent{}).
			Where("teacher_id = ? AND assignment_id = ?", teacherID, row.ID).
			Count(&cnt)
		if cnt > 0 {
			continue
		}
		ev := &models.ScheduleEvent{
			TeacherID:    teacherID,
			CourseID:     &row.CourseID,
			AssignmentID: &row.ID,
			Title:        "Deadline: " + row.Title,
			StartTime:    row.DueDate,
			AllDay:       true,
			Type:         models.ScheduleDeadline,
			Color:        "#ef4444",
		}
		if err2 := s.db.Create(ev).Error; err2 == nil {
			created++
		}
	}
	return created, nil
}
