package delivery

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"rest-project/internal/db"
	"rest-project/internal/models"
	"rest-project/internal/services/storage"
)

type AttachmentHandler struct {
	storage storage.StorageService
}

func NewAttachmentHandler(s storage.StorageService) *AttachmentHandler {
	return &AttachmentHandler{storage: s}
}

type attachmentResponse struct {
	models.Attachment
	URL string `json:"url"`
}

func (h *AttachmentHandler) toResponse(c *gin.Context, a models.Attachment) attachmentResponse {
	url := ""
	if h.storage != nil {
		ctx, cancel := contextWithTimeout(c, 5*time.Second)
		defer cancel()
		url, _ = h.storage.PresignGet(ctx, a.ObjectKey, 30*time.Minute)
	}
	return attachmentResponse{Attachment: a, URL: url}
}

// Create — POST /api/teacher/attachments  (JSON: target_type, target_id?, key, filename, content_type, size)
func (h *AttachmentHandler) Create(c *gin.Context) {
	var input struct {
		TargetType  string `json:"target_type" binding:"required"`
		TargetID    *uint  `json:"target_id"`
		ObjectKey   string `json:"object_key" binding:"required"`
		Filename    string `json:"filename" binding:"required"`
		ContentType string `json:"content_type"`
		SizeBytes   int64  `json:"size_bytes"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}
	if !isValidTargetType(input.TargetType) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid target_type"})
		return
	}
	uid, _ := c.Get("user_id")
	ownerID, _ := uid.(uint)

	a := models.Attachment{
		OwnerID:     ownerID,
		TargetType:  input.TargetType,
		TargetID:    input.TargetID,
		ObjectKey:   input.ObjectKey,
		Filename:    input.Filename,
		ContentType: input.ContentType,
		SizeBytes:   input.SizeBytes,
	}
	if err := db.DB.Create(&a).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, h.toResponse(c, a))
}

// List — GET /api/teacher/attachments?target_type=assignment&target_id=12
func (h *AttachmentHandler) List(c *gin.Context) {
	targetType := c.Query("target_type")
	targetIDStr := c.Query("target_id")

	uid, _ := c.Get("user_id")
	ownerID, _ := uid.(uint)

	q := db.DB.Where("owner_id = ?", ownerID)
	if targetType != "" {
		q = q.Where("target_type = ?", targetType)
	}
	if targetIDStr != "" {
		if id, err := strconv.ParseUint(targetIDStr, 10, 64); err == nil {
			q = q.Where("target_id = ?", uint(id))
		}
	}
	var rows []models.Attachment
	if err := q.Order("created_at DESC").Limit(200).Find(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	out := make([]attachmentResponse, 0, len(rows))
	for _, a := range rows {
		out = append(out, h.toResponse(c, a))
	}
	c.JSON(http.StatusOK, out)
}

// Delete — DELETE /api/teacher/attachments/:id
// Удаляет запись + файл в MinIO.
func (h *AttachmentHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	uid, _ := c.Get("user_id")
	ownerID, _ := uid.(uint)

	var a models.Attachment
	if err := db.DB.Where("id = ? AND owner_id = ?", id, ownerID).First(&a).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	// Best-effort удаление из storage
	if h.storage != nil {
		ctx, cancel := contextWithTimeout(c, 5*time.Second)
		defer cancel()
		_ = h.storage.RemoveObject(ctx, a.ObjectKey)
	}
	if err := db.DB.Delete(&a).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func isValidTargetType(t string) bool {
	switch t {
	case "assignment", "submission", "course", "free":
		return true
	}
	return false
}
