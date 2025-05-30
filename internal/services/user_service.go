package services

import (
	"errors"
	"golang.org/x/crypto/bcrypt"
	"rest-project/internal/models"
	"rest-project/internal/repository"
)

type UserService struct {
	repo repository.UserRepository
}

func NewUserService(userRepo repository.UserRepository) *UserService {
	return &UserService{repo: userRepo}
}

// GetAllUsers возвращает всех пользователей
func (s *UserService) GetAllUsers() ([]models.User, error) {
	return s.repo.GetAll()
}

// GetUserByID возвращает пользователя по ID
func (s *UserService) GetUserByID(id uint) (*models.User, error) {
	return s.repo.GetByID(id)
}

// CreateUser создает нового пользователя
func (s *UserService) CreateUser(username, password string, role models.Role) (*models.User, error) {
	// Проверяем, что пользователь с таким именем не существует
	_, err := s.repo.GetUserByUsername(username)
	if err == nil {
		return nil, errors.New("username already exists")
	}
	
	// Хешируем пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	
	user := &models.User{
		Username: username,
		Password: string(hashedPassword),
		Role:     role,
	}
	
	err = s.repo.Create(user)
	return user, err
}

// UpdateUser обновляет данные пользователя
func (s *UserService) UpdateUser(id uint, username, password string, role models.Role) (*models.User, error) {
	user, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.New("user not found")
	}
	
	// Если имя пользователя изменено, проверяем уникальность
	if username != user.Username {
		_, err := s.repo.GetUserByUsername(username)
		if err == nil {
			return nil, errors.New("username already exists")
		}
		user.Username = username
	}
	
	// Если пароль указан, обновляем его
	if password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return nil, err
		}
		user.Password = string(hashedPassword)
	}
	
	// Обновляем роль
	user.Role = role
	
	err = s.repo.Update(id, user)
	if err != nil {
		return nil, err
	}
	
	return s.repo.GetByID(id)
}

// DeleteUser удаляет пользователя
func (s *UserService) DeleteUser(id uint) error {
	return s.repo.Delete(id)
}

// GetUsersByRole возвращает пользователей с заданной ролью
func (s *UserService) GetUsersByRole(role models.Role) ([]models.User, error) {
	return s.repo.GetUsersByRole(role)
} 