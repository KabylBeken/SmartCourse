package repository

import (
	"gorm.io/gorm"
	"rest-project/internal/models"
)

type CourseRepository interface {
	GetAll() ([]models.Course, error)
	GetByID(id uint) (*models.Course, error)
	Create(course *models.Course) error
	Update(id uint, course *models.Course) error
	Delete(id uint) error
	GetCoursesByTeacherID(teacherID uint) ([]models.Course, error)
	GetCoursesByStudentID(studentID uint) ([]models.Course, error)
	AddStudentToCourse(courseID, studentID uint) error
	RemoveStudentFromCourse(courseID, studentID uint) error
	AssignTeacherToCourse(courseID, teacherID uint) error
}

type CourseRepositoryImpl struct {
	db *gorm.DB
}

func NewCourseRepository(db *gorm.DB) *CourseRepositoryImpl {
	return &CourseRepositoryImpl{db: db}
}

func (r *CourseRepositoryImpl) GetAll() ([]models.Course, error) {
	var courses []models.Course
	err := r.db.Find(&courses).Error
	return courses, err
}

func (r *CourseRepositoryImpl) GetByID(id uint) (*models.Course, error) {
	var course models.Course
	err := r.db.First(&course, id).Error
	return &course, err
}

func (r *CourseRepositoryImpl) Create(course *models.Course) error {
	return r.db.Create(course).Error
}

func (r *CourseRepositoryImpl) Update(id uint, course *models.Course) error {
	return r.db.Model(&models.Course{}).Where("id = ?", id).Updates(course).Error
}

func (r *CourseRepositoryImpl) Delete(id uint) error {
	return r.db.Delete(&models.Course{}, id).Error
}

func (r *CourseRepositoryImpl) GetCoursesByTeacherID(teacherID uint) ([]models.Course, error) {
	var courses []models.Course
	err := r.db.Where("teacher_id = ?", teacherID).Find(&courses).Error
	return courses, err
}

func (r *CourseRepositoryImpl) GetCoursesByStudentID(studentID uint) ([]models.Course, error) {
	var courses []models.Course
	err := r.db.Joins("JOIN course_students ON courses.id = course_students.course_id").
		Where("course_students.user_id = ?", studentID).
		Find(&courses).Error
	return courses, err
}

func (r *CourseRepositoryImpl) AddStudentToCourse(courseID, studentID uint) error {
	return r.db.Exec("INSERT INTO course_students (course_id, user_id) VALUES (?, ?)", 
		courseID, studentID).Error
}

func (r *CourseRepositoryImpl) RemoveStudentFromCourse(courseID, studentID uint) error {
	return r.db.Exec("DELETE FROM course_students WHERE course_id = ? AND user_id = ?", 
		courseID, studentID).Error
}

func (r *CourseRepositoryImpl) AssignTeacherToCourse(courseID, teacherID uint) error {
	return r.db.Model(&models.Course{}).Where("id = ?", courseID).
		Update("teacher_id", teacherID).Error
} 