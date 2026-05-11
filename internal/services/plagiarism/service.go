package plagiarism

import (
	"encoding/json"
	"errors"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"rest-project/internal/models"
)

// Service — оркестратор: submissions → TF-IDF → нәтижені БД-ға сақтау.
type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

// SimilarityThreshold — pair суspіціозды болу үшін минималды cosine.
const SimilarityThreshold = 0.55

// TopK — сақталатын ең суspіціозды жұп саны.
const TopK = 50

// ScanAssignment — тапсырма бойынша барлық submission-дерді жинап TF-IDF есептейді,
// есепті сақтайды және `PlagiarismReport`-ты қайтарады.
func (s *Service) ScanAssignment(assignmentID uint) (*models.PlagiarismReport, error) {
	if s == nil || s.db == nil {
		return nil, errors.New("plagiarism service is not initialized")
	}

	// 1) Submissions + студент аттарын бірге сұраймыз
	type row struct {
		ID        uint   `gorm:"column:id"`
		StudentID uint   `gorm:"column:student_id"`
		Content   string `gorm:"column:content"`
		Username  string `gorm:"column:username"`
	}
	var rows []row
	if err := s.db.Table("assignment_submissions AS s").
		Select("s.id, s.student_id, s.content, u.username").
		Joins("JOIN users u ON u.id = s.student_id").
		Where("s.assignment_id = ? AND s.deleted_at IS NULL", assignmentID).
		Where("s.status IN ?", []string{"submitted", "late", "graded"}).
		Where("LENGTH(s.content) > 50").
		Order("s.id ASC").
		Find(&rows).Error; err != nil {
		return nil, err
	}
	if len(rows) < 2 {
		// Кем дегенде 2 submission керек
		rep := &models.PlagiarismReport{
			AssignmentID:  assignmentID,
			ScanID:        uuid.NewString(),
			Pairs:         "[]",
			DocCount:      len(rows),
			AvgSimilarity: 0,
			MaxSimilarity: 0,
		}
		if err := s.db.Create(rep).Error; err != nil {
			return nil, err
		}
		return rep, nil
	}

	// 2) TF-IDF
	docs := make([]Document, len(rows))
	studentByDoc := make([]uint, len(rows))
	nameByDoc := make([]string, len(rows))
	for i, r := range rows {
		docs[i] = Document{ID: r.ID, Text: r.Content}
		studentByDoc[i] = r.StudentID
		nameByDoc[i] = r.Username
	}
	sim := Compute(docs)
	pairs := TopPairs(sim.Matrix, SimilarityThreshold, TopK)

	// 3) Pair → JSON
	out := make([]models.PlagiarismPair, 0, len(pairs))
	for _, p := range pairs {
		out = append(out, models.PlagiarismPair{
			StudentA:     studentByDoc[p.I],
			StudentB:     studentByDoc[p.J],
			StudentAName: nameByDoc[p.I],
			StudentBName: nameByDoc[p.J],
			SubmissionA:  sim.IDs[p.I],
			SubmissionB:  sim.IDs[p.J],
			Similarity:   p.Similarity,
			SnippetA:     snippet(rows[p.I].Content),
			SnippetB:     snippet(rows[p.J].Content),
		})
	}
	pairsJSON, _ := json.Marshal(out)

	rep := &models.PlagiarismReport{
		AssignmentID:  assignmentID,
		ScanID:        uuid.NewString(),
		Pairs:         string(pairsJSON),
		DocCount:      len(rows),
		AvgSimilarity: sim.Avg,
		MaxSimilarity: sim.Max,
	}
	if err := s.db.Create(rep).Error; err != nil {
		return nil, err
	}
	return rep, nil
}

// LatestReport — соңғы есепті қайтарады (parsed pairs-пен).
func (s *Service) LatestReport(assignmentID uint) (*models.PlagiarismReportResponse, error) {
	if s == nil || s.db == nil {
		return nil, errors.New("plagiarism service is not initialized")
	}
	var rep models.PlagiarismReport
	if err := s.db.Where("assignment_id = ?", assignmentID).
		Order("created_at DESC").
		First(&rep).Error; err != nil {
		return nil, err
	}
	var pairs []models.PlagiarismPair
	if rep.Pairs != "" {
		_ = json.Unmarshal([]byte(rep.Pairs), &pairs)
	}
	return &models.PlagiarismReportResponse{
		ID:            rep.ID,
		AssignmentID:  rep.AssignmentID,
		ScanID:        rep.ScanID,
		DocCount:      rep.DocCount,
		AvgSimilarity: rep.AvgSimilarity,
		MaxSimilarity: rep.MaxSimilarity,
		CreatedAt:     rep.CreatedAt,
		Pairs:         pairs,
	}, nil
}

// snippet — мәтіннің 240-символдық алғашқы үзіндісі (бір сөздің ортасында үзбеу).
func snippet(text string) string {
	const limit = 240
	if len(text) <= limit {
		return text
	}
	cut := text[:limit]
	if sp := strings.LastIndexAny(cut, " \n\t"); sp > 100 {
		cut = cut[:sp]
	}
	return strings.TrimSpace(cut) + "…"
}
