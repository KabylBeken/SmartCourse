package models

import "time"

// PlagiarismReport — нәтиже TF-IDF көрсеткіш бойынша submission-дар арасында.
type PlagiarismReport struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	AssignmentID  uint      `gorm:"not null;index" json:"assignment_id"`
	ScanID        string    `gorm:"size:64;not null" json:"scan_id"`
	Pairs         string    `gorm:"type:text;default:'[]'" json:"-"` // JSON-string, API-да PairsParsed
	DocCount      int       `gorm:"not null;default:0" json:"doc_count"`
	AvgSimilarity float64   `gorm:"not null;default:0" json:"avg_similarity"`
	MaxSimilarity float64   `gorm:"not null;default:0" json:"max_similarity"`
	CreatedAt     time.Time `json:"created_at"`
}

func (PlagiarismReport) TableName() string { return "plagiarism_reports" }

// PlagiarismPair — бір "күдікті" жұп.
type PlagiarismPair struct {
	StudentA       uint    `json:"student_a"`
	StudentB       uint    `json:"student_b"`
	StudentAName   string  `json:"student_a_name,omitempty"`
	StudentBName   string  `json:"student_b_name,omitempty"`
	SubmissionA    uint    `json:"submission_a"`
	SubmissionB    uint    `json:"submission_b"`
	Similarity     float64 `json:"similarity"`
	SnippetA       string  `json:"snippet_a,omitempty"`
	SnippetB       string  `json:"snippet_b,omitempty"`
}

// PlagiarismReportResponse — API response with parsed pairs.
type PlagiarismReportResponse struct {
	ID            uint              `json:"id"`
	AssignmentID  uint              `json:"assignment_id"`
	ScanID        string            `json:"scan_id"`
	DocCount      int               `json:"doc_count"`
	AvgSimilarity float64           `json:"avg_similarity"`
	MaxSimilarity float64           `json:"max_similarity"`
	CreatedAt     time.Time         `json:"created_at"`
	Pairs         []PlagiarismPair  `json:"pairs"`
}
