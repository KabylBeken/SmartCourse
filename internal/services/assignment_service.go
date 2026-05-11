package services

import (
	"encoding/json"
	"errors"
	"time"

	"rest-project/internal/models"
	"rest-project/internal/repository"
)

type AssignmentService struct {
	repo       repository.AssignmentRepository
	courseRepo repository.CourseRepository
	userRepo   repository.UserRepository
}

func NewAssignmentService(assignmentRepo repository.AssignmentRepository,
	courseRepo repository.CourseRepository,
	userRepo repository.UserRepository) *AssignmentService {
	return &AssignmentService{
		repo:       assignmentRepo,
		courseRepo: courseRepo,
		userRepo:   userRepo,
	}
}

// CreateAssignmentRequest — тапсырма жасауға арналған сұраныс
type CreateAssignmentRequest struct {
	Title       string                  `json:"title"`
	Description string                  `json:"description"`
	CourseID    uint                    `json:"course_id"`
	DueDate     time.Time               `json:"due_date"`
	MaxScore    float64                 `json:"max_score"`
	Type        string                  `json:"type"` // "essay" | "test"
	Criteria    []models.EssayCriterion `json:"criteria"`
	Questions   []models.TestQuestion   `json:"questions"`
	WordCount   int                     `json:"word_count"`
}

// GetAllAssignments возвращает все задания
func (s *AssignmentService) GetAllAssignments() ([]models.Assignment, error) {
	return s.repo.GetAll()
}

// GetAssignmentByID возвращает задание по ID
func (s *AssignmentService) GetAssignmentByID(id uint) (*models.Assignment, error) {
	return s.repo.GetByID(id)
}

// GetAssignmentForTeacher returns one assignment after checking teacher ownership.
func (s *AssignmentService) GetAssignmentForTeacher(id uint, teacherID uint) (*models.AssignmentResponse, error) {
	assignment, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.New("assignment not found")
	}

	course, err := s.courseRepo.GetByID(assignment.CourseID)
	if err != nil {
		return nil, errors.New("course not found")
	}
	if course.TeacherID != teacherID {
		return nil, errors.New("teacher is not assigned to this course")
	}

	return toResponse(assignment, true), nil
}

// GetAssignmentForStudent returns one assignment after checking course enrollment.
func (s *AssignmentService) GetAssignmentForStudent(id uint, studentID uint) (*models.AssignmentResponse, error) {
	student, err := s.userRepo.GetByID(studentID)
	if err != nil {
		return nil, errors.New("student not found")
	}
	if student.Role != models.RoleStudent {
		return nil, errors.New("user is not a student")
	}

	assignment, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.New("assignment not found")
	}
	if !assignment.DeletedAt.Time.IsZero() {
		return nil, errors.New("assignment was deleted")
	}

	courses, err := s.courseRepo.GetCoursesByStudentID(studentID)
	if err != nil {
		return nil, err
	}
	for _, course := range courses {
		if course.ID == assignment.CourseID {
			return toResponse(assignment, false), nil
		}
	}

	return nil, errors.New("student is not enrolled in this course")
}

// CreateAssignment жаңа тапсырма жасайды
func (s *AssignmentService) CreateAssignment(req CreateAssignmentRequest, teacherID uint) (*models.AssignmentResponse, error) {
	// Teacher тексеру
	teacher, err := s.userRepo.GetByID(teacherID)
	if err != nil {
		return nil, errors.New("teacher not found")
	}
	if teacher.Role != models.RoleTeacher {
		return nil, errors.New("user is not a teacher")
	}

	// Курс тексеру
	course, err := s.courseRepo.GetByID(req.CourseID)
	if err != nil {
		return nil, errors.New("course not found")
	}
	if course.TeacherID != teacherID {
		return nil, errors.New("teacher is not assigned to this course")
	}

	// Тип тексеру
	if req.Type != string(models.AssignmentTypeEssay) && req.Type != string(models.AssignmentTypeTest) {
		req.Type = string(models.AssignmentTypeEssay) // default
	}

	if req.MaxScore <= 0 {
		req.MaxScore = 100
	}

	// JSON-ге айналдыру
	criteriaJSON, _ := json.Marshal(req.Criteria)
	questionsJSON, _ := json.Marshal(req.Questions)

	assignment := &models.Assignment{
		Title:       req.Title,
		Description: req.Description,
		CourseID:    req.CourseID,
		DueDate:     req.DueDate,
		MaxScore:    req.MaxScore,
		Type:        req.Type,
		Criteria:    string(criteriaJSON),
		Questions:   string(questionsJSON),
		WordCount:   req.WordCount,
	}

	err = s.repo.Create(assignment)
	if err != nil {
		return nil, err
	}

	return toResponse(assignment, true), nil
}

// UpdateAssignment тапсырманы өзгертеді
func (s *AssignmentService) UpdateAssignment(id uint, req CreateAssignmentRequest, teacherID uint) (*models.AssignmentResponse, error) {
	assignment, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.New("assignment not found")
	}

	course, err := s.courseRepo.GetByID(assignment.CourseID)
	if err != nil {
		return nil, errors.New("course not found")
	}
	if course.TeacherID != teacherID {
		return nil, errors.New("teacher is not assigned to this course")
	}

	criteriaJSON, _ := json.Marshal(req.Criteria)
	questionsJSON, _ := json.Marshal(req.Questions)

	if req.Type != string(models.AssignmentTypeEssay) && req.Type != string(models.AssignmentTypeTest) {
		req.Type = assignment.Type
	}
	if req.MaxScore <= 0 {
		req.MaxScore = assignment.MaxScore
	}

	assignment.Title = req.Title
	assignment.Description = req.Description
	assignment.DueDate = req.DueDate
	assignment.MaxScore = req.MaxScore
	assignment.Type = req.Type
	assignment.Criteria = string(criteriaJSON)
	assignment.Questions = string(questionsJSON)
	assignment.WordCount = req.WordCount

	err = s.repo.Update(id, assignment)
	if err != nil {
		return nil, err
	}

	updated, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	return toResponse(updated, true), nil
}

// UpdateAssignmentCriteria saves essay criteria without changing the rest of the assignment.
func (s *AssignmentService) UpdateAssignmentCriteria(id uint, criteria []models.EssayCriterion, teacherID uint) (*models.AssignmentResponse, error) {
	assignment, err := s.repo.GetByID(id)
	if err != nil {
		return nil, errors.New("assignment not found")
	}

	course, err := s.courseRepo.GetByID(assignment.CourseID)
	if err != nil {
		return nil, errors.New("course not found")
	}
	if course.TeacherID != teacherID {
		return nil, errors.New("teacher is not assigned to this course")
	}

	criteriaJSON, err := json.Marshal(criteria)
	if err != nil {
		return nil, err
	}

	assignment.Criteria = string(criteriaJSON)
	if err := s.repo.Update(id, assignment); err != nil {
		return nil, err
	}

	updated, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	return toResponse(updated, true), nil
}

// DeleteAssignment тапсырманы жояды
func (s *AssignmentService) DeleteAssignment(id uint, teacherID uint) error {
	assignment, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("assignment not found")
	}

	course, err := s.courseRepo.GetByID(assignment.CourseID)
	if err != nil {
		return errors.New("course not found")
	}
	if course.TeacherID != teacherID {
		return errors.New("teacher is not assigned to this course")
	}

	return s.repo.Delete(id)
}

// GetAssignmentsByCourse — teacher үшін (correctIndex көрінеді)
func (s *AssignmentService) GetAssignmentsByCourse(courseID uint) ([]models.AssignmentResponse, error) {
	assignments, err := s.repo.GetAssignmentsByCourseID(courseID)
	if err != nil {
		return nil, err
	}
	result := make([]models.AssignmentResponse, len(assignments))
	for i, a := range assignments {
		result[i] = *toResponse(&a, true)
	}
	return result, nil
}

// GetAssignmentsByCourseForStudent — student үшін (correctIndex жасырылған)
func (s *AssignmentService) GetAssignmentsByCourseForStudent(courseID uint) ([]models.AssignmentResponse, error) {
	assignments, err := s.repo.GetAssignmentsByCourseID(courseID)
	if err != nil {
		return nil, err
	}
	result := make([]models.AssignmentResponse, len(assignments))
	for i, a := range assignments {
		result[i] = *toResponse(&a, false) // false = correctIndex жасырылады
	}
	return result, nil
}

// GetAssignmentByIDWithDeleted возвращает задание по ID, включая удаленные
func (s *AssignmentService) GetAssignmentByIDWithDeleted(id uint) (*models.Assignment, error) {
	return s.repo.GetByIDWithDeleted(id)
}

// toResponse Assignment-ті AssignmentResponse-қа айналдырады
// showCorrect=false болса, тест жауаптары жасырылады
func toResponse(a *models.Assignment, showCorrect bool) *models.AssignmentResponse {
	resp := &models.AssignmentResponse{
		ID:          a.ID,
		Title:       a.Title,
		Description: a.Description,
		CourseID:    a.CourseID,
		DueDate:     a.DueDate,
		MaxScore:    a.MaxScore,
		Type:        a.Type,
		WordCount:   a.WordCount,
		CreatedAt:   a.CreatedAt,
		UpdatedAt:   a.UpdatedAt,
	}

	// Essay критериялары
	if a.Criteria != "" && a.Criteria != "null" {
		var criteria []models.EssayCriterion
		if err := json.Unmarshal([]byte(a.Criteria), &criteria); err == nil {
			resp.Criteria = criteria
		}
	}

	// Test сұрақтары
	if a.Questions != "" && a.Questions != "null" {
		var questions []models.TestQuestion
		if err := json.Unmarshal([]byte(a.Questions), &questions); err == nil {
			for i := range questions {
				if questions[i].ID == 0 {
					questions[i].ID = i + 1
				}
			}
			if !showCorrect {
				// Student үшін дұрыс жауап пен түсініктемені жасыру (түсті көрсету тек test_review арқылы)
				for i := range questions {
					questions[i].CorrectIndex = -1
					questions[i].Explanation = ""
				}
			}
			resp.Questions = questions
		}
	}

	return resp
}
