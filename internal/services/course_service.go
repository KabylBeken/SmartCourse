package service

import (
	"errors"
	"rest-project/internal/models"
	"rest-project/internal/repository"
)

type CourseService struct {
	repo    repository.CourseRepository
	userRepo repository.UserRepository
}

func NewCourseService(courseRepo repository.CourseRepository, userRepo repository.UserRepository) *CourseService {
	return &CourseService{repo: courseRepo, userRepo: userRepo}
}

// GetAllCourses возвращает все курсы
func (s *CourseService) GetAllCourses() ([]models.Course, error) {
	return s.repo.GetAll()
}

// GetCourseByID возвращает курс по ID
func (s *CourseService) GetCourseByID(id uint) (*models.Course, error) {
	return s.repo.GetByID(id)
}

// CreateCourse создает новый курс
func (s *CourseService) CreateCourse(title, description string, teacherID uint) (*models.Course, error) {
	// Проверяем, что учитель существует и имеет роль Teacher
	teacher, err := s.userRepo.GetByID(teacherID)
	if err != nil {
		return nil, errors.New("teacher not found")
	}
	
	if teacher.Role != models.RoleTeacher {
		return nil, errors.New("user is not a teacher")
	}
	
	course := &models.Course{
		Title:       title,
		Description: description,
		TeacherID:   teacherID,
	}
	
	err = s.repo.Create(course)
	return course, err
}

// UpdateCourse обновляет курс
func (s *CourseService) UpdateCourse(id uint, title, description string) (*models.Course, error) {
	course, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	
	course.Title = title
	course.Description = description
	
	err = s.repo.Update(id, course)
	if err != nil {
		return nil, err
	}
	
	return s.repo.GetByID(id)
}

// DeleteCourse удаляет курс
func (s *CourseService) DeleteCourse(id uint) error {
	return s.repo.Delete(id)
}

// GetCoursesByTeacher возвращает курсы преподавателя
func (s *CourseService) GetCoursesByTeacher(teacherID uint) ([]models.Course, error) {
	return s.repo.GetCoursesByTeacherID(teacherID)
}

// GetCoursesByStudent возвращает курсы студента
func (s *CourseService) GetCoursesByStudent(studentID uint) ([]models.Course, error) {
	return s.repo.GetCoursesByStudentID(studentID)
}

// AddStudentToCourse добавляет студента на курс
func (s *CourseService) AddStudentToCourse(courseID, studentID uint) error {
	// Проверяем, что студент существует и имеет роль Student
	student, err := s.userRepo.GetByID(studentID)
	if err != nil {
		return errors.New("student not found")
	}
	
	if student.Role != models.RoleStudent {
		return errors.New("user is not a student")
	}
	
	// Проверяем, что курс существует
	_, err = s.repo.GetByID(courseID)
	if err != nil {
		return errors.New("course not found")
	}
	
	return s.repo.AddStudentToCourse(courseID, studentID)
}

// RemoveStudentFromCourse удаляет студента с курса
func (s *CourseService) RemoveStudentFromCourse(courseID, studentID uint) error {
	return s.repo.RemoveStudentFromCourse(courseID, studentID)
}

// AssignTeacherToCourse назначает преподавателя на курс
func (s *CourseService) AssignTeacherToCourse(courseID, teacherID uint) error {
	// Проверяем, что преподаватель существует и имеет роль Teacher
	teacher, err := s.userRepo.GetByID(teacherID)
	if err != nil {
		return errors.New("teacher not found")
	}
	
	if teacher.Role != models.RoleTeacher {
		return errors.New("user is not a teacher")
	}
	
	// Проверяем, что курс существует
	_, err = s.repo.GetByID(courseID)
	if err != nil {
		return errors.New("course not found")
	}
	
	return s.repo.AssignTeacherToCourse(courseID, teacherID)
} 