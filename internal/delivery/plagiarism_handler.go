package delivery

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"rest-project/internal/db"
	"rest-project/internal/services/plagiarism"
	"rest-project/internal/services/queue"
)

type PlagiarismHandler struct {
	svc *plagiarism.Service
	q   *queue.Queue
}

func NewPlagiarismHandler(svc *plagiarism.Service, q *queue.Queue) *PlagiarismHandler {
	return &PlagiarismHandler{svc: svc, q: q}
}

// POST /api/teacher/assignments/:id/plagiarism/scan
// Тапсырманың иесі мұғалім болуын тексереді, содан кейін queue-ге `plagiarism_scan` қояды.
func (h *PlagiarismHandler) StartScan(c *gin.Context) {
	if h.q == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "queue disabled"})
		return
	}
	assignmentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	uid, _ := c.Get("user_id")
	teacherID, _ := uid.(uint)

	if err := ensureTeacherOwnsAssignment(uint(assignmentID), teacherID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	payload := plagiarism.ScanPayload{AssignmentID: uint(assignmentID)}
	raw, _ := json.Marshal(payload)

	ctx, cancel := contextWithTimeout(c, 5*time.Second)
	defer cancel()

	id, err := h.q.Enqueue(ctx, "plagiarism_scan", json.RawMessage(raw), teacherID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusAccepted, gin.H{"job_id": id, "status": "queued", "type": "plagiarism_scan"})
}

// GET /api/teacher/assignments/:id/plagiarism
// Соңғы есепті қайтарады.
func (h *PlagiarismHandler) LatestReport(c *gin.Context) {
	if h.svc == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "plagiarism disabled"})
		return
	}
	assignmentID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	uid, _ := c.Get("user_id")
	teacherID, _ := uid.(uint)

	if err := ensureTeacherOwnsAssignment(uint(assignmentID), teacherID); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	rep, err := h.svc.LatestReport(uint(assignmentID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rep)
}

// ensureTeacherOwnsAssignment — тапсырма мұғалімнің курсына тиісті ме тексереді.
func ensureTeacherOwnsAssignment(assignmentID, teacherID uint) error {
	var teacherIDfromDB uint
	err := db.DB.Table("assignments a").
		Select("c.teacher_id").
		Joins("JOIN courses c ON c.id = a.course_id").
		Where("a.id = ? AND a.deleted_at IS NULL", assignmentID).
		Limit(1).
		Scan(&teacherIDfromDB).Error
	if err != nil {
		return errors.New("assignment not found")
	}
	if teacherIDfromDB == 0 {
		return errors.New("assignment not found")
	}
	if teacherIDfromDB != teacherID {
		return errors.New("forbidden: teacher does not own this assignment")
	}
	return nil
}
