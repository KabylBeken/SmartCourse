package repository

import (
	"errors"
	"strings"

	"gorm.io/gorm"
	"rest-project/internal/models"
)

type PromptRepository interface {
	List(userID uint, visibility, category, search, collection string, tags []string) ([]models.Prompt, error)
	GetByID(id uint) (*models.Prompt, error)
	Create(p *models.Prompt) error
	Update(id uint, p *models.Prompt) error
	Delete(id uint) error
	AddVersion(p *models.Prompt) error
	GetVersions(id uint) ([]models.PromptVersion, error)
}

type PromptRepositoryImpl struct {
	db *gorm.DB
}

func NewPromptRepository(db *gorm.DB) *PromptRepositoryImpl {
	return &PromptRepositoryImpl{db: db}
}

func (r *PromptRepositoryImpl) List(userID uint, visibility, category, search, collection string, tags []string) ([]models.Prompt, error) {
	var items []models.Prompt
	q := r.db.Model(&models.Prompt{})
	// visibility
	switch visibility {
	case "mine":
		q = q.Where("teacher_id = ? AND is_template = false", userID)
	case "public":
		q = q.Where("is_public = true")
	case "favorites":
		q = q.Where("teacher_id = ? AND is_favorite = true", userID)
	case "templates":
		q = q.Where("is_template = true")
	default:
		q = q.Where("teacher_id = ? OR is_public = true OR is_template = true", userID)
	}
	if category != "" && category != "all" { q = q.Where("category = ?", category) }
	if collection != "" { q = q.Where("collection = ?", collection) }
	if search != "" {
		like := "%" + strings.ToLower(search) + "%"
		q = q.Where("LOWER(title) LIKE ? OR LOWER(description) LIKE ?", like, like)
	}
	if len(tags) > 0 {
		// простая проверка: все указанные теги содержатся
		for _, t := range tags {
			q = q.Where("? = ANY(tags)", t)
		}
	}
	if err := q.Order("updated_at DESC").Find(&items).Error; err != nil { return nil, err }
	return items, nil
}

func (r *PromptRepositoryImpl) GetByID(id uint) (*models.Prompt, error) {
	var p models.Prompt
	if err := r.db.First(&p, id).Error; err != nil { return nil, err }
	return &p, nil
}

func (r *PromptRepositoryImpl) Create(p *models.Prompt) error {
	return r.db.Create(p).Error
}

func (r *PromptRepositoryImpl) Update(id uint, p *models.Prompt) error {
	res := r.db.Model(&models.Prompt{}).Where("id = ?", id).Updates(p)
	if res.Error != nil { return res.Error }
	if res.RowsAffected == 0 { return errors.New("prompt not found") }
	return nil
}

func (r *PromptRepositoryImpl) Delete(id uint) error {
	return r.db.Delete(&models.Prompt{}, id).Error
}

func (r *PromptRepositoryImpl) AddVersion(p *models.Prompt) error {
	// Определяем следующий номер версии
	var last models.PromptVersion
	r.db.Where("prompt_id = ?", p.ID).Order("version DESC").First(&last)
	ver := last.Version + 1
	v := models.PromptVersion{
		PromptID:   p.ID,
		Version:    ver,
		Title:      p.Title,
		Description: p.Description,
		PromptText: p.PromptText,
		Category:   p.Category,
		Tags:       p.Tags,
	}
	return r.db.Create(&v).Error
}

func (r *PromptRepositoryImpl) GetVersions(id uint) ([]models.PromptVersion, error) {
	var vs []models.PromptVersion
	if err := r.db.Where("prompt_id = ?", id).Order("version DESC").Find(&vs).Error; err != nil { return nil, err }
	return vs, nil
}
