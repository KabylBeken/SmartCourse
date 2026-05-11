package services

import (
	"errors"
	"time"

	"rest-project/internal/models"
)

// Revert — откатить промпт к указанной версии
func (s *PromptService) Revert(id uint, version int, teacherID uint) (*models.Prompt, error) {
	p, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if p.TeacherID != teacherID {
		return nil, errors.New("forbidden")
	}
	versions, err := s.repo.GetVersions(id)
	if err != nil {
		return nil, err
	}
	var v *models.PromptVersion
	for i := range versions {
		if versions[i].Version == version {
			v = &versions[i]
			break
		}
	}
	if v == nil {
		return nil, errors.New("version not found")
	}
	upd := &models.Prompt{
		Title:       v.Title,
		Description: v.Description,
		PromptText:  v.PromptText,
		Category:    v.Category,
		Tags:        v.Tags,
		UpdatedAt:   time.Now(),
	}
	if err := s.repo.Update(id, upd); err != nil {
		return nil, err
	}
	return s.repo.GetByID(id)
}
