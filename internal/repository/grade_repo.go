package repository

import (
	"gorm.io/gorm"
	"rest-project/internal/models"
)

type GradeRepository interface {
	GetAll() ([]models.Grade, error)
	GetByID(id uint) (*models.Grade, error)
	Create(grade *models.Grade) error
	Update(id uint, grade *models.Grade) error
	Delete(id uint) error
	GetGradesByStudentID(studentID uint) ([]models.Grade, error)
	GetGradesByAssignmentID(assignmentID uint) ([]models.Grade, error)
	GetGradeByStudentAndAssignment(studentID, assignmentID uint) (*models.Grade, error)
}

type GradeRepositoryImpl struct {
	db *gorm.DB
}

func NewGradeRepository(db *gorm.DB) *GradeRepositoryImpl {
	return &GradeRepositoryImpl{db: db}
}

func (r *GradeRepositoryImpl) GetAll() ([]models.Grade, error) {
	var grades []models.Grade
	err := r.db.Find(&grades).Error
	return grades, err
}

func (r *GradeRepositoryImpl) GetByID(id uint) (*models.Grade, error) {
	var grade models.Grade
	err := r.db.First(&grade, id).Error
	return &grade, err
}

func (r *GradeRepositoryImpl) Create(grade *models.Grade) error {
	return r.db.Create(grade).Error
}

func (r *GradeRepositoryImpl) Update(id uint, grade *models.Grade) error {
	return r.db.Model(&models.Grade{}).Where("id = ?", id).Updates(grade).Error
}

func (r *GradeRepositoryImpl) Delete(id uint) error {
	return r.db.Delete(&models.Grade{}, id).Error
}

func (r *GradeRepositoryImpl) GetGradesByStudentID(studentID uint) ([]models.Grade, error) {
	var grades []models.Grade
	err := r.db.Where("student_id = ?", studentID).Find(&grades).Error
	return grades, err
}

func (r *GradeRepositoryImpl) GetGradesByAssignmentID(assignmentID uint) ([]models.Grade, error) {
	var grades []models.Grade
	err := r.db.Where("assignment_id = ?", assignmentID).Find(&grades).Error
	return grades, err
}

func (r *GradeRepositoryImpl) GetGradeByStudentAndAssignment(studentID, assignmentID uint) (*models.Grade, error) {
	var grade models.Grade
	err := r.db.Where("student_id = ? AND assignment_id = ?", studentID, assignmentID).First(&grade).Error
	return &grade, err
} 