package queue

import (
	"context"
	"encoding/json"
	"log"
	"time"
)

// Handler — обработчик одного типа задач. Возвращает результат и ошибку.
type Handler func(ctx context.Context, job *Job, progress func(int)) (any, error)

// Worker запускает блокирующий цикл обработки задач.
type Worker struct {
	q        *Queue
	handlers map[string]Handler
	notifier func(userID uint, status JobStatus) // публикация статуса в WebSocket
}

func NewWorker(q *Queue) *Worker {
	return &Worker{q: q, handlers: map[string]Handler{}}
}

func (w *Worker) Register(jobType string, h Handler) {
	w.handlers[jobType] = h
}

// SetNotifier — подключает publish в WS-хаб. Может быть nil.
func (w *Worker) SetNotifier(fn func(userID uint, status JobStatus)) {
	w.notifier = fn
}

// Run — основной цикл воркера. Запускать в горутине.
func (w *Worker) Run(ctx context.Context) {
	if w.q == nil {
		log.Println("[worker] queue disabled — воркер не запущен")
		return
	}
	log.Println("[worker] запущен")
	for {
		select {
		case <-ctx.Done():
			log.Println("[worker] остановлен")
			return
		default:
		}
		job, err := w.q.Dequeue(ctx, 5*time.Second)
		if err != nil {
			// timeout/error → ретраим
			continue
		}
		if job == nil {
			continue
		}
		w.process(ctx, job)
	}
}

func (w *Worker) process(ctx context.Context, job *Job) {
	handler, ok := w.handlers[job.Type]
	if !ok {
		w.fail(ctx, job, "no handler for type: "+job.Type)
		return
	}

	w.update(ctx, job, JobStatus{ID: job.ID, Status: "running", Progress: 5})

	progress := func(p int) {
		if p < 0 {
			p = 0
		}
		if p > 100 {
			p = 100
		}
		w.update(ctx, job, JobStatus{ID: job.ID, Status: "running", Progress: p})
	}

	jobCtx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()

	result, err := handler(jobCtx, job, progress)
	if err != nil {
		w.fail(ctx, job, err.Error())
		return
	}
	raw, _ := json.Marshal(result)
	w.update(ctx, job, JobStatus{ID: job.ID, Status: "done", Progress: 100, Result: raw})
}

func (w *Worker) update(ctx context.Context, job *Job, st JobStatus) {
	_ = w.q.SetStatus(ctx, st)
	if w.notifier != nil {
		w.notifier(job.UserID, st)
	}
}

func (w *Worker) fail(ctx context.Context, job *Job, msg string) {
	w.update(ctx, job, JobStatus{ID: job.ID, Status: "failed", Progress: 100, Error: msg})
	log.Printf("[worker] job %s failed: %s", job.ID, msg)
}
