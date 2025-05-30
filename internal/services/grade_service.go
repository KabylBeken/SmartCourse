package services

import (
	"errors"
	"rest-project/internal/models"
	"rest-project/internal/repository"
)

type GradeService struct {
	repo            repository.GradeRepository
	assignmentRepo  repository.AssignmentRepository
	courseRepo      repository.CourseRepository
	userRepo        repository.UserRepository
}

func NewGradeService(
	gradeRepo repository.GradeRepository,
	assignmentRepo repository.AssignmentRepository,
	courseRepo repository.CourseRepository,
	userRepo repository.UserRepository,
) *GradeService {
	return &GradeService{
		repo:           gradeRepo,
		assignmentRepo: assignmentRepo,
		courseRepo:     courseRepo,
		userRepo:       userRepo,
	}
}

// GetAllGrades возвращает все оценки
func (s *GradeService) GetAllGrades() ([]models.Grade, error) {
	return s.repo.GetAll()
}

// GetGradeByID возвращает оценку по ID
func (s *GradeService) GetGradeByID(id uint) (*models.Grade, error) {
	return s.repo.GetByID(id)
}

// CreateGrade создает новую оценку
func (s *GradeService) CreateGrade(assignmentID, studentID uint, score float64, feedback string, teacherID uint) (*models.Grade, error) {
	// Проверяем, что задание существует (включая удаленные)
	assignment, err := s.assignmentRepo.GetByID(assignmentID)
	if err != nil {
		return nil, errors.New("assignment not found")
	}

	// Проверяем, что задание не удалено
	if !assignment.DeletedAt.Time.IsZero() {
		return nil, errors.New("cannot create grade for deleted assignment")
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
	
	// Проверяем, что студент существует и имеет роль Student
	student, err := s.userRepo.GetByID(studentID)
	if err != nil {
		return nil, errors.New("student not found")
	}
	
	if student.Role != models.RoleStudent {
		return nil, errors.New("user is not a student")
	}
	
	// Проверяем, что студент записан на этот курс
	courses, err := s.courseRepo.GetCoursesByStudentID(studentID)
	if err != nil {
		return nil, err
	}
	
	var studentEnrolled bool
	for _, c := range courses {
		if c.ID == course.ID {
			studentEnrolled = true
			break
		}
	}
	
	if !studentEnrolled {
		return nil, errors.New("student is not enrolled in this course")
	}
	
	// Проверяем, что оценка в пределах от 0 до 100
	if score < 0 || score > 100 {
		return nil, errors.New("score must be between 0 and 100")
	}
	
	grade := &models.Grade{
		StudentID:    studentID,
		AssignmentID: assignmentID,
		Score:        score,
		Feedback:     feedback,
	}
	
	err = s.repo.Create(grade)
	return grade, err
}

// UpdateGrade обновляет оценку
func (s *GradeService) UpdateGrade(id uint, score float64, feedback string, teacherID uint) (*models.Grade, error) {
	// Проверяем, что оценка существует
	grade, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.New("grade not found")
	}
	
	// Проверяем, что задание существует
	assignment, err := s.assignmentRepo.GetByID(grade.AssignmentID)
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
	
	// Проверяем, что оценка в пределах от 0 до 100
	if score < 0 || score > 100 {
		return nil, errors.New("score must be between 0 and 100")
	}
	
	grade.Score = score
	grade.Feedback = feedback
	
	err = s.repo.Update(id, grade)
	if err != nil {
		return nil, err
	}
	
	return s.repo.GetByID(id)
}

// DeleteGrade удаляет оценку
func (s *GradeService) DeleteGrade(id uint, teacherID uint) error {
	// Проверяем, что оценка существует
	grade, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("grade not found")
	}
	
	// Проверяем, что задание существует
	assignment, err := s.assignmentRepo.GetByID(grade.AssignmentID)
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

// GetGradesByStudent возвращает оценки студента
func (s *GradeService) GetGradesByStudent(studentID uint) ([]models.Grade, error) {
	return s.repo.GetGradesByStudentID(studentID)
}

// GetGradesByAssignment возвращает оценки по заданию
func (s *GradeService) GetGradesByAssignment(assignmentID uint) ([]models.Grade, error) {
	return s.repo.GetGradesByAssignmentID(assignmentID)
} 