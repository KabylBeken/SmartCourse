package delivery

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"rest-project/internal/models"
	"rest-project/internal/services/schedule"
)

type ScheduleHandler struct {
	svc *schedule.Service
}

func NewScheduleHandler(svc *schedule.Service) *ScheduleHandler {
	return &ScheduleHandler{svc: svc}
}

func (h *ScheduleHandler) teacherID(c *gin.Context) (uint, bool) {
	uid, ok := c.Get("user_id")
	if !ok {
		return 0, false
	}
	id, ok := uid.(uint)
	return id, ok
}

// GET /api/teacher/schedule?start=2026-05-01T00:00:00Z&end=2026-05-31T23:59:59Z&course_id=
func (h *ScheduleHandler) List(c *gin.Context) {
	tid, ok := h.teacherID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var start, end time.Time
	if s := c.Query("start"); s != "" {
		start, _ = time.Parse(time.RFC3339, s)
	}
	if e := c.Query("end"); e != "" {
		end, _ = time.Parse(time.RFC3339, e)
	}
	courseID, _ := strconv.ParseUint(c.Query("course_id"), 10, 64)

	events, err := h.svc.List(tid, start, end, uint(courseID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, events)
}

// POST /api/teacher/schedule
func (h *ScheduleHandler) Create(c *gin.Context) {
	tid, ok := h.teacherID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var req models.CreateScheduleEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ev, err := h.svc.Create(tid, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, ev)
}

// PUT /api/teacher/schedule/:id
func (h *ScheduleHandler) Update(c *gin.Context) {
	tid, ok := h.teacherID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req models.UpdateScheduleEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ev, err := h.svc.Update(tid, uint(eventID), req)
	if err != nil {
		if err.Error() == "event not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ev)
}

// DELETE /api/teacher/schedule/:id
func (h *ScheduleHandler) Delete(c *gin.Context) {
	tid, ok := h.teacherID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	eventID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := h.svc.Delete(tid, uint(eventID)); err != nil {
		if err.Error() == "event not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// POST /api/teacher/schedule/sync
func (h *ScheduleHandler) SyncDeadlines(c *gin.Context) {
	tid, ok := h.teacherID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	count, err := h.svc.SyncDeadlines(tid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"created": count})
}
