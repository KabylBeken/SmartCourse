package services

import (
	"rest-project/internal/models"
)

// Интерфейс репозитория студентов
type StudentRepository interface {
	GetAll() ([]models.Student, error)
	GetById(id int) (*models.Student, error)
	Create(student *models.Student) error
	Update(id int, student *models.StudentEdit) error
	Delete(studentID int) error
}

// Структура сервиса студентов
type StudentService struct {
	repo StudentRepository
}

// Конструктор StudentService
func NewStudentService(studentRepo StudentRepository) *StudentService {
	return &StudentService{repo: studentRepo}
}

// Получение всех студентов
func (s *StudentService) GetAllStudents() ([]models.Student, error) {
	return s.repo.GetAll()
}

// Получение студента по ID
func (s *StudentService) GetStudentByID(id int) (*models.Student, error) {
	return s.repo.GetById(id)
}

// Создание нового студента
func (s *StudentService) Create(fullName, birthdate string, age int) (*models.Student, error) {
	student := &models.Student{
		FullName:  fullName,
		Birthdate: birthdate,
		Age:       age,
	}
	err := s.repo.Create(student)
	return student, err
}

// Обновление данных студента
func (s *StudentService) Update(id int, studentEdit *models.StudentEdit) (*models.Student, error) {
	err := s.repo.Update(id, studentEdit)
	if err != nil {
		return nil, err
	}
	return s.GetStudentByID(id)
}

// Удаление студента
func (s *StudentService) DeleteStudent(studentID int) error {
	return s.repo.Delete(studentID)
}
