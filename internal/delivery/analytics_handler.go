package delivery

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"rest-project/internal/services/analytics"
)

type AnalyticsHandler struct {
	svc *analytics.Service
}

func NewAnalyticsHandler(svc *analytics.Service) *AnalyticsHandler {
	return &AnalyticsHandler{svc: svc}
}

func (h *AnalyticsHandler) teacherID(c *gin.Context) (uint, bool) {
	uid, ok := c.Get("user_id")
	if !ok {
		return 0, false
	}
	id, ok := uid.(uint)
	return id, ok
}

// GET /api/teacher/analytics/overview
func (h *AnalyticsHandler) Overview(c *gin.Context) {
	id, ok := h.teacherID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	res, err := h.svc.Overview(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// GET /api/teacher/analytics/grades-over-time?course_id=&days=30
func (h *AnalyticsHandler) GradesOverTime(c *gin.Context) {
	id, ok := h.teacherID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	courseID, _ := strconv.ParseUint(c.Query("course_id"), 10, 64)
	days, _ := strconv.Atoi(c.Query("days"))
	if days == 0 {
		days = 30
	}
	res, err := h.svc.GradesOverTime(id, uint(courseID), days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// GET /api/teacher/analytics/heatmap?course_id=
func (h *AnalyticsHandler) Heatmap(c *gin.Context) {
	id, ok := h.teacherID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	courseID, _ := strconv.ParseUint(c.Query("course_id"), 10, 64)
	res, err := h.svc.Heatmap(id, uint(courseID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// GET /api/teacher/analytics/at-risk?course_id=&threshold=60
func (h *AnalyticsHandler) AtRisk(c *gin.Context) {
	id, ok := h.teacherID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	courseID, _ := strconv.ParseUint(c.Query("course_id"), 10, 64)
	threshold, _ := strconv.ParseFloat(c.Query("threshold"), 64)
	res, err := h.svc.AtRisk(id, uint(courseID), threshold)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}
