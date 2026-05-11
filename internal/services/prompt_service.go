package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"rest-project/internal/models"
	"rest-project/internal/repository"
)

type PromptService struct {
	repo *repository.PromptRepositoryImpl
}

type CreatePromptRequest struct {
	Title      string   `json:"title" binding:"required,min=3,max=100"`
	Description string  `json:"description"`
	PromptText string   `json:"prompt_text" binding:"required,min=10"`
	Category   string   `json:"category" binding:"required"`
	IsPublic   bool     `json:"is_public"`
	Tags       []string `json:"tags"`
	Collection *string  `json:"collection"`
	IsTemplate bool     `json:"is_template"`
}

type UpdatePromptRequest struct {
	Title      *string   `json:"title"`
	Description *string  `json:"description"`
	PromptText *string   `json:"prompt_text"`
	Category   *string   `json:"category"`
	IsPublic   *bool     `json:"is_public"`
	Tags       []string  `json:"tags"`
	Collection *string   `json:"collection"`
	IsFavorite *bool     `json:"is_favorite"`
}

func NewPromptService(repo *repository.PromptRepositoryImpl) *PromptService { return &PromptService{repo: repo} }

func (s *PromptService) List(userID uint, visibility, category, search, collection string, tags []string) ([]models.Prompt, error) {
	return s.repo.List(userID, visibility, category, search, collection, tags)
}

func (s *PromptService) Get(id uint) (*models.Prompt, error) { return s.repo.GetByID(id) }

func (s *PromptService) Create(req CreatePromptRequest, teacherID uint) (*models.Prompt, error) {
	p := &models.Prompt{
		TeacherID:  teacherID,
		Title:      req.Title,
		Description: req.Description,
		PromptText: req.PromptText,
		Category:   req.Category,
		IsPublic:   req.IsPublic,
		Tags:       req.Tags,
		IsTemplate: req.IsTemplate,
	}
	if req.Collection != nil { p.Collection = req.Collection }
	if err := s.repo.Create(p); err != nil { return nil, err }
	_ = s.repo.AddVersion(p)
	return p, nil
}

func (s *PromptService) Update(id uint, req UpdatePromptRequest, teacherID uint) (*models.Prompt, error) {
	p, err := s.repo.GetByID(id)
	if err != nil { return nil, err }
	if p.TeacherID != teacherID && !p.IsTemplate {
		return nil, errors.New("forbidden")
	}
	// Snapshot before update
	_ = s.repo.AddVersion(p)

	upd := &models.Prompt{}
	if req.Title != nil { upd.Title = *req.Title }
	if req.Description != nil { upd.Description = *req.Description }
	if req.PromptText != nil { upd.PromptText = *req.PromptText }
	if req.Category != nil { upd.Category = *req.Category }
	if req.IsPublic != nil { upd.IsPublic = *req.IsPublic }
	if req.Collection != nil { upd.Collection = req.Collection }
	if req.IsFavorite != nil { upd.IsFavorite = *req.IsFavorite }
	if req.Tags != nil { upd.Tags = req.Tags }
	upd.UpdatedAt = time.Now()
	if err := s.repo.Update(id, upd); err != nil { return nil, err }
	return s.repo.GetByID(id)
}

func (s *PromptService) Delete(id uint, teacherID uint) error {
	p, err := s.repo.GetByID(id)
	if err != nil { return err }
	if p.TeacherID != teacherID {
		return errors.New("forbidden")
	}
	return s.repo.Delete(id)
}

func (s *PromptService) Clone(id uint, teacherID uint) (*models.Prompt, error) {
	p, err := s.repo.GetByID(id)
	if err != nil { return nil, err }
	clone := &models.Prompt{
		TeacherID:  teacherID,
		Title:      fmt.Sprintf("%s (Copy)", p.Title),
		Description: p.Description,
		PromptText: p.PromptText,
		Category:   p.Category,
		IsPublic:   false,
		Tags:       p.Tags,
		Collection: p.Collection,
		IsTemplate: false,
	}
	if err := s.repo.Create(clone); err != nil { return nil, err }
	_ = s.repo.AddVersion(clone)
	return clone, nil
}

func (s *PromptService) ToggleFavorite(id uint, teacherID uint, fav bool) error {
	p, err := s.repo.GetByID(id)
	if err != nil { return err }
	if p.TeacherID != teacherID {
		return errors.New("forbidden")
	}
	upd := &models.Prompt{ IsFavorite: fav, UpdatedAt: time.Now() }
	return s.repo.Update(id, upd)
}

func (s *PromptService) Use(id uint, variables map[string]string) (string, error) {
	p, err := s.repo.GetByID(id)
	if err != nil { return "", err }
	// increment use_count
	_ = s.repo.Update(id, &models.Prompt{ UseCount: p.UseCount + 1, UpdatedAt: time.Now() })
	// compile preview
	text := p.PromptText
	for k, v := range variables {
		placeholder := "{{" + k + "}}"
		text = strings.ReplaceAll(text, placeholder, v)
	}
	return text, nil
}

func (s *PromptService) Versions(id uint, teacherID uint) ([]models.PromptVersion, error) {
	p, err := s.repo.GetByID(id)
	if err != nil { return nil, err }
	if p.TeacherID != teacherID {
		return nil, errors.New("forbidden")
	}
	return s.repo.GetVersions(id)
}
