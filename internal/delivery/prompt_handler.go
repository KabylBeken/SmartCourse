package delivery

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"rest-project/internal/services"
)

type PromptHandler struct {
	service *services.PromptService
}

func (h *PromptHandler) Revert(c *gin.Context) {
    id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
    ver, _ := strconv.Atoi(c.Param("version"))
    userID, _ := c.Get("user_id")
    teacherID := userID.(uint)
    p, err := h.service.Revert(uint(id), ver, teacherID)
    if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
    c.JSON(http.StatusOK, p)
}

func NewPromptHandler(s *services.PromptService) *PromptHandler { return &PromptHandler{service: s} }

type createPromptInput struct {
	Title       string   `json:"title" binding:"required,min=3,max=100"`
	Description string   `json:"description"`
	PromptText  string   `json:"prompt_text" binding:"required,min=10"`
	Category    string   `json:"category" binding:"required"`
	IsPublic    bool     `json:"is_public"`
	Tags        []string `json:"tags"`
	Collection  *string  `json:"collection"`
	IsTemplate  bool     `json:"is_template"`
}

type updatePromptInput struct {
	Title       *string  `json:"title"`
	Description *string  `json:"description"`
	PromptText  *string  `json:"prompt_text"`
	Category    *string  `json:"category"`
	IsPublic    *bool    `json:"is_public"`
	Tags        []string `json:"tags"`
	Collection  *string  `json:"collection"`
	IsFavorite  *bool    `json:"is_favorite"`
}

func (h *PromptHandler) List(c *gin.Context) {
	userID, _ := c.Get("user_id")
	teacherID := userID.(uint)
	visibility := c.Query("visibility")
	category := c.Query("category")
	search := c.Query("search")
	collection := c.Query("collection")
	tagsQ := c.Query("tags")
	var tags []string
	if tagsQ != "" { tags = append(tags, tagsQ) }
	items, err := h.service.List(teacherID, visibility, category, search, collection, tags)
	if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()}); return }
	c.JSON(http.StatusOK, items)
}

func (h *PromptHandler) Get(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	p, err := h.service.Get(uint(id))
	if err != nil { c.JSON(http.StatusNotFound, gin.H{"error": "Prompt not found"}); return }
	c.JSON(http.StatusOK, p)
}

func (h *PromptHandler) Create(c *gin.Context) {
	var in createPromptInput
	if err := c.ShouldBindJSON(&in); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	userID, _ := c.Get("user_id")
	teacherID := userID.(uint)
	p, err := h.service.Create(services.CreatePromptRequest(in), teacherID)
	if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	c.JSON(http.StatusCreated, p)
}

func (h *PromptHandler) Update(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	var in updatePromptInput
	if err := c.ShouldBindJSON(&in); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	userID, _ := c.Get("user_id")
	teacherID := userID.(uint)
	p, err := h.service.Update(uint(id), services.UpdatePromptRequest(in), teacherID)
	if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	c.JSON(http.StatusOK, p)
}

func (h *PromptHandler) Delete(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	userID, _ := c.Get("user_id")
	teacherID := userID.(uint)
	if err := h.service.Delete(uint(id), teacherID); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	c.Status(http.StatusNoContent)
}

func (h *PromptHandler) Clone(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	userID, _ := c.Get("user_id")
	teacherID := userID.(uint)
	p, err := h.service.Clone(uint(id), teacherID)
	if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	c.JSON(http.StatusCreated, p)
}

func (h *PromptHandler) ToggleFavorite(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	type favReq struct { IsFavorite bool `json:"is_favorite"` }
	var in favReq
	if err := c.ShouldBindJSON(&in); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	userID, _ := c.Get("user_id")
	teacherID := userID.(uint)
	if err := h.service.ToggleFavorite(uint(id), teacherID, in.IsFavorite); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	c.Status(http.StatusOK)
}

func (h *PromptHandler) Use(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	type useReq struct { Variables map[string]string `json:"variables"` }
	var in useReq
	_ = c.ShouldBindJSON(&in)
	compiled, err := h.service.Use(uint(id), in.Variables)
	if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	c.JSON(http.StatusOK, gin.H{"compiled": compiled})
}

func (h *PromptHandler) Versions(c *gin.Context) {
	id, _ := strconv.ParseUint(c.Param("id"), 10, 64)
	userID, _ := c.Get("user_id")
	teacherID := userID.(uint)
	items, err := h.service.Versions(uint(id), teacherID)
	if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	c.JSON(http.StatusOK, items)
}

func (h *PromptHandler) Export(c *gin.Context) {
	userID, _ := c.Get("user_id")
	teacherID := userID.(uint)
	items, err := h.service.List(teacherID, "mine", "", "", "", nil)
	if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()}); return }
	c.JSON(http.StatusOK, items)
}

type importReq struct { Items []services.CreatePromptRequest `json:"items"` }

func (h *PromptHandler) Import(c *gin.Context) {
	userID, _ := c.Get("user_id")
	teacherID := userID.(uint)
	var in importReq
	if err := c.ShouldBindJSON(&in); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()}); return }
	created := 0
	for _, it := range in.Items {
		if _, err := h.service.Create(it, teacherID); err == nil { created++ }
	}
	c.JSON(http.StatusOK, gin.H{"created": created})
}
