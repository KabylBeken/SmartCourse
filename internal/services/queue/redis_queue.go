package queue

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"os"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
)

// Job — единица фоновой работы. Тип job_type описывает что делать.
type Job struct {
	ID        string          `json:"id"`
	Type      string          `json:"type"`     // "ai_evaluate" | "ai_generate_criteria" | ...
	Payload   json.RawMessage `json:"payload"`  // произвольные данные
	UserID    uint            `json:"user_id"`
	CreatedAt time.Time       `json:"created_at"`
}

type JobStatus struct {
	ID         string          `json:"id"`
	Status     string          `json:"status"`        // "queued" | "running" | "done" | "failed"
	Progress   int             `json:"progress"`      // 0..100
	Result     json.RawMessage `json:"result,omitempty"`
	Error      string          `json:"error,omitempty"`
	UpdatedAt  time.Time       `json:"updated_at"`
}

type Queue struct {
	rdb       *redis.Client
	queueKey  string
	statusTTL time.Duration
}

// NewFromEnv создаёт очередь из REDIS_ADDR. Возвращает (nil, nil) если не задан.
func NewFromEnv() (*Queue, error) {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		log.Println("[queue] REDIS_ADDR не задан — очередь отключена")
		return nil, nil
	}
	rdb := redis.NewClient(&redis.Options{Addr: addr})
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, err
	}
	log.Printf("[queue] Redis готов: %s", addr)
	return &Queue{rdb: rdb, queueKey: "smartcourse:jobs", statusTTL: 24 * time.Hour}, nil
}

// Enqueue ставит задачу в очередь и сохраняет начальный статус.
func (q *Queue) Enqueue(ctx context.Context, jobType string, payload any, userID uint) (string, error) {
	if q == nil {
		return "", errors.New("queue disabled")
	}
	rawPayload, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	job := Job{
		ID:        uuid.NewString(),
		Type:      jobType,
		Payload:   rawPayload,
		UserID:    userID,
		CreatedAt: time.Now(),
	}
	data, _ := json.Marshal(job)
	if err := q.rdb.LPush(ctx, q.queueKey, data).Err(); err != nil {
		return "", err
	}
	if err := q.SetStatus(ctx, JobStatus{ID: job.ID, Status: "queued", Progress: 0, UpdatedAt: time.Now()}); err != nil {
		return "", err
	}
	return job.ID, nil
}

// Dequeue блокирующе достаёт задачу (используется воркером).
func (q *Queue) Dequeue(ctx context.Context, timeout time.Duration) (*Job, error) {
	if q == nil {
		return nil, errors.New("queue disabled")
	}
	res, err := q.rdb.BRPop(ctx, timeout, q.queueKey).Result()
	if err != nil {
		return nil, err
	}
	if len(res) < 2 {
		return nil, nil
	}
	var job Job
	if err := json.Unmarshal([]byte(res[1]), &job); err != nil {
		return nil, err
	}
	return &job, nil
}

func (q *Queue) statusKey(id string) string { return "smartcourse:jobs:status:" + id }

func (q *Queue) SetStatus(ctx context.Context, st JobStatus) error {
	if q == nil {
		return errors.New("queue disabled")
	}
	st.UpdatedAt = time.Now()
	data, _ := json.Marshal(st)
	return q.rdb.Set(ctx, q.statusKey(st.ID), data, q.statusTTL).Err()
}

func (q *Queue) GetStatus(ctx context.Context, id string) (*JobStatus, error) {
	if q == nil {
		return nil, errors.New("queue disabled")
	}
	v, err := q.rdb.Get(ctx, q.statusKey(id)).Result()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	var st JobStatus
	if err := json.Unmarshal([]byte(v), &st); err != nil {
		return nil, err
	}
	return &st, nil
}

// Client возвращает сырой redis-клиент (для pub/sub нотификаций).
func (q *Queue) Client() *redis.Client { return q.rdb }
