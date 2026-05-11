package plagiarism

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"rest-project/internal/services/queue"
)

// ScanPayload — Redis-queue payload.
type ScanPayload struct {
	AssignmentID uint `json:"assignment_id"`
}

// MakeScanHandler — queue handler "plagiarism_scan" үшін.
// Бар сервисті пайдаланады, прогресс хабарламаларын беріп тұрады.
func MakeScanHandler(svc *Service) queue.Handler {
	return func(ctx context.Context, job *queue.Job, progress func(int)) (any, error) {
		if svc == nil {
			return nil, errors.New("plagiarism service disabled")
		}
		var p ScanPayload
		if err := json.Unmarshal(job.Payload, &p); err != nil {
			return nil, fmt.Errorf("invalid payload: %w", err)
		}
		if p.AssignmentID == 0 {
			return nil, errors.New("assignment_id is required")
		}

		progress(10) // submissions жинаймыз
		report, err := svc.ScanAssignment(p.AssignmentID)
		if err != nil {
			return nil, err
		}
		progress(90)

		// Толық response қайтарамыз (parsed pairs-пен)
		resp, _ := svc.LatestReport(p.AssignmentID)
		progress(100)
		if resp != nil {
			return resp, nil
		}
		return report, nil
	}
}
