package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"rest-project/internal/models"
	"rest-project/internal/repository"

	"gorm.io/gorm"
)

type AssignmentSubmissionService struct {
	repo           repository.AssignmentSubmissionRepository
	assignmentRepo repository.AssignmentRepository
	courseRepo     repository.CourseRepository
	userRepo       repository.UserRepository
	gradeRepo      repository.GradeRepository
}

type AssignmentSubmissionRequest struct {
	Content string              `json:"content"`
	Answers []models.TestAnswer `json:"answers"`
}

func NewAssignmentSubmissionService(
	submissionRepo repository.AssignmentSubmissionRepository,
	assignmentRepo repository.AssignmentRepository,
	courseRepo repository.CourseRepository,
	userRepo repository.UserRepository,
	gradeRepo repository.GradeRepository,
) *AssignmentSubmissionService {
	return &AssignmentSubmissionService{
		repo:           submissionRepo,
		assignmentRepo: assignmentRepo,
		courseRepo:     courseRepo,
		userRepo:       userRepo,
		gradeRepo:      gradeRepo,
	}
}

func (s *AssignmentSubmissionService) GetStudentSubmission(assignmentID, studentID uint) (*models.AssignmentSubmissionResponse, error) {
	assignment, err := s.ensureStudentCanAccessAssignment(assignmentID, studentID)
	if err != nil {
		return nil, err
	}

	grade := s.getGrade(studentID, assignmentID)
	submission, err := s.repo.GetByStudentAndAssignment(studentID, assignmentID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		resp := &models.AssignmentSubmissionResponse{
			StudentID:    studentID,
			AssignmentID: assignmentID,
			Status:       responseStatus(models.SubmissionStatusDraft, grade),
			Grade:        grade,
		}
		s.attachTestReviewIfGraded(resp, assignment)
		return resp, nil
	}
	if err != nil {
		return nil, err
	}

	resp := toSubmissionResponse(submission, grade)
	s.attachTestReviewIfGraded(resp, assignment)
	return resp, nil
}

func (s *AssignmentSubmissionService) SaveDraft(assignmentID, studentID uint, req AssignmentSubmissionRequest) (*models.AssignmentSubmissionResponse, error) {
	if _, err := s.ensureStudentCanAccessAssignment(assignmentID, studentID); err != nil {
		return nil, err
	}
	if s.getGrade(studentID, assignmentID) != nil {
		return nil, errors.New("graded submission cannot be changed")
	}

	existing, lookupErr := s.repo.GetByStudentAndAssignment(studentID, assignmentID)
	if lookupErr != nil && !errors.Is(lookupErr, gorm.ErrRecordNotFound) {
		return nil, lookupErr
	}
	if lookupErr == nil && existing.Status != models.SubmissionStatusDraft {
		return nil, errors.New("submitted assignment cannot be changed")
	}

	answersJSON, err := json.Marshal(req.Answers)
	if err != nil {
		return nil, err
	}

	wordCount := countWords(req.Content)
	now := time.Now()
	submission := &models.AssignmentSubmission{
		StudentID:    studentID,
		AssignmentID: assignmentID,
		Content:      req.Content,
		Answers:      string(answersJSON),
		Status:       models.SubmissionStatusDraft,
		WordCount:    wordCount,
	}

	if errors.Is(lookupErr, gorm.ErrRecordNotFound) {
		if createErr := s.repo.Create(submission); createErr != nil {
			return nil, createErr
		}
		submission.CreatedAt = now
		submission.UpdatedAt = now
		return toSubmissionResponse(submission, nil), nil
	}

	submission.ID = existing.ID
	if updateErr := s.repo.Update(existing.ID, submission); updateErr != nil {
		return nil, updateErr
	}

	updated, err := s.repo.GetByID(existing.ID)
	if err != nil {
		return nil, err
	}
	return toSubmissionResponse(updated, nil), nil
}

func (s *AssignmentSubmissionService) Submit(assignmentID, studentID uint, req AssignmentSubmissionRequest) (*models.AssignmentSubmissionResponse, error) {
	assignment, err := s.ensureStudentCanAccessAssignment(assignmentID, studentID)
	if err != nil {
		return nil, err
	}
	if s.getGrade(studentID, assignmentID) != nil {
		return nil, errors.New("graded submission cannot be changed")
	}

	existing, lookupErr := s.repo.GetByStudentAndAssignment(studentID, assignmentID)
	if lookupErr != nil && !errors.Is(lookupErr, gorm.ErrRecordNotFound) {
		return nil, lookupErr
	}
	if lookupErr == nil && existing.Status != models.SubmissionStatusDraft {
		return nil, errors.New("assignment has already been submitted")
	}

	if err := s.validateSubmission(assignment, req); err != nil {
		return nil, err
	}

	now := time.Now()
	status := models.SubmissionStatusSubmitted
	if now.After(assignment.DueDate) {
		status = models.SubmissionStatusLate
	}

	answersJSON, err := json.Marshal(req.Answers)
	if err != nil {
		return nil, err
	}

	submission := &models.AssignmentSubmission{
		StudentID:    studentID,
		AssignmentID: assignmentID,
		Content:      req.Content,
		Answers:      string(answersJSON),
		Status:       status,
		WordCount:    countWords(req.Content),
		SubmittedAt:  &now,
	}

	if assignment.Type == string(models.AssignmentTypeTest) {
		status = models.SubmissionStatusGraded
		submission.Status = status
	}

	if errors.Is(lookupErr, gorm.ErrRecordNotFound) {
		if createErr := s.repo.Create(submission); createErr != nil {
			return nil, createErr
		}
	} else {
		submission.ID = existing.ID
		if updateErr := s.repo.Update(existing.ID, submission); updateErr != nil {
			return nil, updateErr
		}
	}

	var grade *models.Grade
	if assignment.Type == string(models.AssignmentTypeTest) {
		grade, err = s.autoGradeTest(assignment, studentID, req.Answers)
		if err != nil {
			return nil, err
		}
	}

	saved, err := s.repo.GetByStudentAndAssignment(studentID, assignmentID)
	if err != nil {
		return nil, err
	}
	resp := toSubmissionResponse(saved, grade)
	s.attachTestReviewIfGraded(resp, assignment)
	return resp, nil
}

func (s *AssignmentSubmissionService) ensureStudentCanAccessAssignment(assignmentID, studentID uint) (*models.Assignment, error) {
	student, err := s.userRepo.GetByID(studentID)
	if err != nil {
		return nil, errors.New("student not found")
	}
	if student.Role != models.RoleStudent {
		return nil, errors.New("user is not a student")
	}

	assignment, err := s.assignmentRepo.GetByID(assignmentID)
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
			return assignment, nil
		}
	}

	return nil, errors.New("student is not enrolled in this course")
}

func (s *AssignmentSubmissionService) validateSubmission(assignment *models.Assignment, req AssignmentSubmissionRequest) error {
	switch assignment.Type {
	case string(models.AssignmentTypeTest):
		questions, err := parseTestQuestions(assignment.Questions)
		if err != nil {
			return errors.New("test questions are invalid")
		}
		if len(questions) == 0 {
			return errors.New("test has no questions")
		}
		if len(req.Answers) != len(questions) {
			return errors.New("all test questions must be answered")
		}

		questionByID := make(map[int]models.TestQuestion, len(questions))
		for _, question := range questions {
			questionByID[question.ID] = question
		}
		seen := make(map[int]bool, len(req.Answers))
		for _, answer := range req.Answers {
			question, ok := questionByID[answer.QuestionID]
			if !ok {
				return errors.New("answer contains unknown question")
			}
			if seen[answer.QuestionID] {
				return errors.New("answer contains duplicate question")
			}
			if answer.SelectedIndex < 0 || answer.SelectedIndex >= len(question.Options) {
				return errors.New("answer option is out of range")
			}
			seen[answer.QuestionID] = true
		}
	default:
		wordCount := countWords(req.Content)
		if strings.TrimSpace(req.Content) == "" {
			return errors.New("essay content is required")
		}
		if assignment.WordCount > 0 && wordCount < assignment.WordCount {
			return fmt.Errorf("essay must contain at least %d words", assignment.WordCount)
		}
	}
	return nil
}

func (s *AssignmentSubmissionService) autoGradeTest(assignment *models.Assignment, studentID uint, answers []models.TestAnswer) (*models.Grade, error) {
	questions, err := parseTestQuestions(assignment.Questions)
	if err != nil {
		return nil, err
	}

	answerByQuestionID := make(map[int]int, len(answers))
	for _, answer := range answers {
		answerByQuestionID[answer.QuestionID] = answer.SelectedIndex
	}

	correct := 0
	for _, question := range questions {
		if answerByQuestionID[question.ID] == question.CorrectIndex {
			correct++
		}
	}

	score := 0.0
	if len(questions) > 0 {
		score = math.Round((assignment.MaxScore*float64(correct)/float64(len(questions)))*100) / 100
	}
	feedback := fmt.Sprintf("Тест автоматты түрде бағаланды: %d/%d дұрыс жауап.", correct, len(questions))

	existing, err := s.gradeRepo.GetGradeByStudentAndAssignment(studentID, assignment.ID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		grade := &models.Grade{
			StudentID:    studentID,
			AssignmentID: assignment.ID,
			Score:        score,
			Feedback:     feedback,
		}
		if createErr := s.gradeRepo.Create(grade); createErr != nil {
			return nil, createErr
		}
		return grade, nil
	}
	if err != nil {
		return nil, err
	}

	existing.Score = score
	existing.Feedback = feedback
	if err := s.gradeRepo.Update(existing.ID, existing); err != nil {
		return nil, err
	}
	return s.gradeRepo.GetByID(existing.ID)
}

func (s *AssignmentSubmissionService) getGrade(studentID, assignmentID uint) *models.Grade {
	grade, err := s.gradeRepo.GetGradeByStudentAndAssignment(studentID, assignmentID)
	if err != nil {
		return nil
	}
	return grade
}

func parseTestQuestions(raw string) ([]models.TestQuestion, error) {
	if raw == "" || raw == "null" {
		return nil, nil
	}
	var questions []models.TestQuestion
	if err := json.Unmarshal([]byte(raw), &questions); err != nil {
		return nil, err
	}
	for i := range questions {
		if questions[i].ID == 0 {
			questions[i].ID = i + 1
		}
	}
	return questions, nil
}

func parseTestAnswers(raw string) []models.TestAnswer {
	if raw == "" || raw == "null" {
		return nil
	}
	var answers []models.TestAnswer
	if err := json.Unmarshal([]byte(raw), &answers); err != nil {
		return nil
	}
	return answers
}

func toSubmissionResponse(submission *models.AssignmentSubmission, grade *models.Grade) *models.AssignmentSubmissionResponse {
	return &models.AssignmentSubmissionResponse{
		ID:           submission.ID,
		StudentID:    submission.StudentID,
		AssignmentID: submission.AssignmentID,
		Content:      submission.Content,
		Answers:      parseTestAnswers(submission.Answers),
		Status:       responseStatus(submission.Status, grade),
		WordCount:    submission.WordCount,
		SubmittedAt:  submission.SubmittedAt,
		CreatedAt:    submission.CreatedAt,
		UpdatedAt:    submission.UpdatedAt,
		Grade:        grade,
	}
}

func responseStatus(status string, grade *models.Grade) string {
	if grade != nil {
		return models.SubmissionStatusGraded
	}
	if status == "" {
		return models.SubmissionStatusDraft
	}
	return status
}

func countWords(value string) int {
	return len(strings.Fields(strings.TrimSpace(value)))
}

func (s *AssignmentSubmissionService) attachTestReviewIfGraded(resp *models.AssignmentSubmissionResponse, assignment *models.Assignment) {
	if assignment.Type != string(models.AssignmentTypeTest) || resp.Grade == nil {
		return
	}
	questions, err := parseTestQuestions(assignment.Questions)
	if err != nil || len(questions) == 0 {
		return
	}
	resp.TestReview = buildTestReview(questions, resp.Answers, assignment.MaxScore)
}

func buildTestReview(questions []models.TestQuestion, answers []models.TestAnswer, maxScore float64) []models.TestQuestionReview {
	selectedByQuestion := make(map[int]int, len(answers))
	for _, answer := range answers {
		selectedByQuestion[answer.QuestionID] = answer.SelectedIndex
	}

	n := len(questions)
	perQuestion := 0.0
	if n > 0 {
		perQuestion = math.Round((maxScore/float64(n))*100) / 100
	}

	review := make([]models.TestQuestionReview, 0, n)
	for _, question := range questions {
		selected, ok := selectedByQuestion[question.ID]
		if !ok {
			selected = -1
		}

		isCorrect := ok && selected == question.CorrectIndex
		pointsEarned := 0.0
		if isCorrect {
			pointsEarned = perQuestion
		}

		review = append(review, models.TestQuestionReview{
			QuestionID:    question.ID,
			SelectedIndex: selected,
			CorrectIndex:  question.CorrectIndex,
			IsCorrect:     isCorrect,
			Explanation:   strings.TrimSpace(question.Explanation),
			PointsEarned:  pointsEarned,
			PointsMax:     perQuestion,
		})
	}

	return review
}
