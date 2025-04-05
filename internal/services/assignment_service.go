package service

import (
	"errors"
	"time"
	"rest-project/internal/models"
	"rest-project/internal/repository"
)

type AssignmentService struct {
	repo      repository.AssignmentRepository
	courseRepo repository.CourseRepository
	userRepo   repository.UserRepository
}

func NewAssignmentService(assignmentRepo repository.AssignmentRepository, 
	courseRepo repository.CourseRepository, 
	userRepo repository.UserRepository) *AssignmentService {
	return &AssignmentService{
		repo:      assignmentRepo,
		courseRepo: courseRepo,
		userRepo:   userRepo,
	}
}

// GetAllAssignments возвращает все задания
func (s *AssignmentService) GetAllAssignments() ([]models.Assignment, error) {
	return s.repo.GetAll()
}

// GetAssignmentByID возвращает задание по ID
func (s *AssignmentService) GetAssignmentByID(id uint) (*models.Assignment, error) {
	return s.repo.GetByID(id)
}

// CreateAssignment создает новое задание
func (s *AssignmentService) CreateAssignment(title, description string, courseID uint, dueDate time.Time, teacherID uint) (*models.Assignment, error) {
	// Проверяем, что преподаватель существует и имеет роль Teacher
	teacher, err := s.userRepo.GetByID(teacherID)
	if err != nil {
		return nil, errors.New("teacher not found")
	}
	
	if teacher.Role != models.RoleTeacher {
		return nil, errors.New("user is not a teacher")
	}
	
	// Проверяем, что курс существует
	course, err := s.courseRepo.GetByID(courseID)
	if err != nil {
		return nil, errors.New("course not found")
	}
	
	// Проверяем, что преподаватель назначен на этот курс
	if course.TeacherID != teacherID {
		return nil, errors.New("teacher is not assigned to this course")
	}
	
	assignment := &models.Assignment{
		Title:       title,
		Description: description,
		CourseID:    courseID,
		DueDate:     dueDate,
	}
	
	err = s.repo.Create(assignment)
	return assignment, err
}

// UpdateAssignment обновляет задание
func (s *AssignmentService) UpdateAssignment(id uint, title, description string, dueDate time.Time, teacherID uint) (*models.Assignment, error) {
	// Проверяем, что задание существует
	assignment, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.New("assignment not found")
	}
	
	// Проверяем, что курс существует
	course, err := s.courseRepo.GetByID(assignment.CourseID)
	if err != nil {
		return nil, errors.New("course not found")
	}
	
	// Проверяем, что преподаватель назначен на этот курс
	if course.TeacherID != teacherID {
		return nil, errors.New("teacher is not assigned to this course")
	}
	
	assignment.Title = title
	assignment.Description = description
	assignment.DueDate = dueDate
	
	err = s.repo.Update(id, assignment)
	if err != nil {
		return nil, err
	}
	
	return s.repo.GetByID(id)
}

// DeleteAssignment удаляет задание
func (s *AssignmentService) DeleteAssignment(id uint, teacherID uint) error {
	// Проверяем, что задание существует
	assignment, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("assignment not found")
	}
	
	// Проверяем, что курс существует
	course, err := s.courseRepo.GetByID(assignment.CourseID)
	if err != nil {
		return errors.New("course not found")
	}
	
	// Проверяем, что преподаватель назначен на этот курс
	if course.TeacherID != teacherID {
		return errors.New("teacher is not assigned to this course")
	}
	
	return s.repo.Delete(id)
}

// GetAssignmentsByCourse возвращает задания курса
func (s *AssignmentService) GetAssignmentsByCourse(courseID uint) ([]models.Assignment, error) {
	return s.repo.GetAssignmentsByCourseID(courseID)
} 