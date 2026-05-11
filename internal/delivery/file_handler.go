package delivery

import (
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"rest-project/internal/services/storage"
)

type FileHandler struct {
	storage storage.StorageService
}

func NewFileHandler(s storage.StorageService) *FileHandler {
	return &FileHandler{storage: s}
}

// Upload — загружает файл (multipart/form-data, поле "file") в MinIO.
func (h *FileHandler) Upload(c *gin.Context) {
	if h.storage == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "storage disabled"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	defer file.Close()

	const maxSize = 25 << 20 // 25 MB
	if header.Size > maxSize {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "file too large (max 25 MB)"})
		return
	}

	objectName := generateObjectName(header.Filename)
	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	ctx, cancel := contextWithTimeout(c, 30*time.Second)
	defer cancel()

	if err := h.storage.PutObject(ctx, objectName, file, header.Size, contentType); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "upload failed: " + err.Error()})
		return
	}

	url, _ := h.storage.PresignGet(ctx, objectName, 15*time.Minute)
	c.JSON(http.StatusOK, gin.H{
		"key":          objectName,
		"url":          url,
		"bucket":       h.storage.GetBucket(),
		"content_type": contentType,
		"size":         header.Size,
		"filename":     header.Filename,
	})
}

// Presign — отдаёт временную ссылку на скачивание объекта.
func (h *FileHandler) Presign(c *gin.Context) {
	if h.storage == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "storage disabled"})
		return
	}
	key := c.Param("key")
	ctx, cancel := contextWithTimeout(c, 5*time.Second)
	defer cancel()
	url, err := h.storage.PresignGet(ctx, key, 15*time.Minute)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "presign failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"url": url, "key": key})
}

// Delete — удаляет объект.
func (h *FileHandler) Delete(c *gin.Context) {
	if h.storage == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "storage disabled"})
		return
	}
	key := c.Param("key")
	ctx, cancel := contextWithTimeout(c, 5*time.Second)
	defer cancel()
	if err := h.storage.RemoveObject(ctx, key); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "delete failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func generateObjectName(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	if ext == "" {
		ext = ".bin"
	}
	return "uploads/" + time.Now().Format("2006/01/02/") + uuid.NewString() + ext
}
