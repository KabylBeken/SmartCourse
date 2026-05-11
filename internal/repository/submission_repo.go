package repository

import (
	"rest-project/internal/models"

	"gorm.io/gorm"
)

type AssignmentSubmissionRepository interface {
	GetByID(id uint) (*models.AssignmentSubmission, error)
	GetByStudentAndAssignment(studentID, assignmentID uint) (*models.AssignmentSubmission, error)
	GetSubmissionsByStudentID(studentID uint) ([]models.AssignmentSubmission, error)
	GetSubmissionsByAssignmentID(assignmentID uint) ([]models.AssignmentSubmission, error)
	Create(submission *models.AssignmentSubmission) error
	Update(id uint, submission *models.AssignmentSubmission) error
}

type AssignmentSubmissionRepositoryImpl struct {
	db *gorm.DB
}

func NewAssignmentSubmissionRepository(db *gorm.DB) *AssignmentSubmissionRepositoryImpl {
	return &AssignmentSubmissionRepositoryImpl{db: db}
}

func (r *AssignmentSubmissionRepositoryImpl) GetByID(id uint) (*models.AssignmentSubmission, error) {
	var submission models.AssignmentSubmission
	err := r.db.First(&submission, id).Error
	return &submission, err
}

func (r *AssignmentSubmissionRepositoryImpl) GetByStudentAndAssignment(studentID, assignmentID uint) (*models.AssignmentSubmission, error) {
	var submission models.AssignmentSubmission
	err := r.db.
		Where("student_id = ? AND assignment_id = ?", studentID, assignmentID).
		First(&submission).Error
	return &submission, err
}

func (r *AssignmentSubmissionRepositoryImpl) GetSubmissionsByStudentID(studentID uint) ([]models.AssignmentSubmission, error) {
	var submissions []models.AssignmentSubmission
	err := r.db.Where("student_id = ?", studentID).Find(&submissions).Error
	return submissions, err
}

func (r *AssignmentSubmissionRepositoryImpl) GetSubmissionsByAssignmentID(assignmentID uint) ([]models.AssignmentSubmission, error) {
	var submissions []models.AssignmentSubmission
	err := r.db.Where("assignment_id = ?", assignmentID).Find(&submissions).Error
	return submissions, err
}

func (r *AssignmentSubmissionRepositoryImpl) Create(submission *models.AssignmentSubmission) error {
	return r.db.Create(submission).Error
}

func (r *AssignmentSubmissionRepositoryImpl) Update(id uint, submission *models.AssignmentSubmission) error {
	return r.db.Model(&models.AssignmentSubmission{}).
		Where("id = ?", id).
		Select("content", "answers", "status", "word_count", "submitted_at").
		Updates(submission).Error
}
