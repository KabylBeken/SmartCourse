package repository

import (
	"gorm.io/gorm"
	"rest-project/internal/models"
)

type AssignmentRepository interface {
	GetAll() ([]models.Assignment, error)
	GetByID(id uint) (*models.Assignment, error)
	Create(assignment *models.Assignment) error
	Update(id uint, assignment *models.Assignment) error
	Delete(id uint) error
	GetAssignmentsByCourseID(courseID uint) ([]models.Assignment, error)
}

type AssignmentRepositoryImpl struct {
	db *gorm.DB
}

func NewAssignmentRepository(db *gorm.DB) *AssignmentRepositoryImpl {
	return &AssignmentRepositoryImpl{db: db}
}

func (r *AssignmentRepositoryImpl) GetAll() ([]models.Assignment, error) {
	var assignments []models.Assignment
	err := r.db.Find(&assignments).Error
	return assignments, err
}

func (r *AssignmentRepositoryImpl) GetByID(id uint) (*models.Assignment, error) {
	var assignment models.Assignment
	err := r.db.First(&assignment, id).Error
	return &assignment, err
}

func (r *AssignmentRepositoryImpl) Create(assignment *models.Assignment) error {
	return r.db.Create(assignment).Error
}

func (r *AssignmentRepositoryImpl) Update(id uint, assignment *models.Assignment) error {
	return r.db.Model(&models.Assignment{}).Where("id = ?", id).Updates(assignment).Error
}

func (r *AssignmentRepositoryImpl) Delete(id uint) error {
	return r.db.Delete(&models.Assignment{}, id).Error
}

func (r *AssignmentRepositoryImpl) GetAssignmentsByCourseID(courseID uint) ([]models.Assignment, error) {
	var assignments []models.Assignment
	err := r.db.Where("course_id = ?", courseID).Find(&assignments).Error
	return assignments, err
} 