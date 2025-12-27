package services

import (
	"errors"
	"rest-project/internal/models"
)

// UserRepositoryForStudents интерфейс для работы с пользователями-студентами
type UserRepositoryForStudents interface {
	GetUsersByRole(role models.Role) ([]models.User, error)
	GetByID(id uint) (*models.User, error)
	Create(user *models.User) error
	Update(id uint, user *models.User) error
	Delete(id uint) error
}

// StudentService сервис для работы со студентами (users с role=student)
type StudentService struct {
	userRepo UserRepositoryForStudents
}

// NewStudentService конструктор
func NewStudentService(userRepo UserRepositoryForStudents) *StudentService {
	return &StudentService{userRepo: userRepo}
}

// StudentResponse структура ответа для студента
type StudentResponse struct {
	ID       uint   `json:"id"`
	FullName string `json:"fullName"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

// GetAllStudents получение всех студентов (users с role=student)
func (s *StudentService) GetAllStudents() ([]StudentResponse, error) {
	users, err := s.userRepo.GetUsersByRole(models.RoleStudent)
	if err != nil {
		return nil, err
	}

	students := make([]StudentResponse, len(users))
	for i, u := range users {
		students[i] = StudentResponse{
			ID:       u.ID,
			FullName: u.Username,
			Username: u.Username,
			Role:     string(u.Role),
		}
	}
	return students, nil
}

// GetStudentByID получение студента по ID
func (s *StudentService) GetStudentByID(id int) (*StudentResponse, error) {
	user, err := s.userRepo.GetByID(uint(id))
	if err != nil {
		return nil, err
	}

	if user.Role != models.RoleStudent {
		return nil, errors.New("пользователь не является студентом")
	}

	return &StudentResponse{
		ID:       user.ID,
		FullName: user.Username,
		Username: user.Username,
		Role:     string(user.Role),
	}, nil
}

// CreateStudent создание нового студента
func (s *StudentService) CreateStudent(username, password string) (*StudentResponse, error) {
	user := &models.User{
		Username: username,
		Password: password,
		Role:     models.RoleStudent,
	}

	err := s.userRepo.Create(user)
	if err != nil {
		return nil, err
	}

	return &StudentResponse{
		ID:       user.ID,
		FullName: user.Username,
		Username: user.Username,
		Role:     string(user.Role),
	}, nil
}

// UpdateStudent обновление данных студента
func (s *StudentService) UpdateStudent(id int, username string) (*StudentResponse, error) {
	user, err := s.userRepo.GetByID(uint(id))
	if err != nil {
		return nil, err
	}

	if user.Role != models.RoleStudent {
		return nil, errors.New("пользователь не является студентом")
	}

	user.Username = username
	err = s.userRepo.Update(uint(id), user)
	if err != nil {
		return nil, err
	}

	return &StudentResponse{
		ID:       user.ID,
		FullName: user.Username,
		Username: user.Username,
		Role:     string(user.Role),
	}, nil
}

// DeleteStudent удаление студента
func (s *StudentService) DeleteStudent(studentID int) error {
	user, err := s.userRepo.GetByID(uint(studentID))
	if err != nil {
		return err
	}

	if user.Role != models.RoleStudent {
		return errors.New("пользователь не является студентом")
	}

	return s.userRepo.Delete(uint(studentID))
}
