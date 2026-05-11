# Новые сервисы и фичи SmartCourse

Эта инсталляция добавляет 5 крупных модулей: **MinIO**, **Redis-очередь**, **WebSocket нотификации**, **PDF экспорт** и **Prometheus + Grafana**.

## 1. Поднятие инфраструктуры

```bash
docker compose up -d postgres redis minio prometheus grafana
```

| Сервис      | URL                                |
|-------------|------------------------------------|
| MinIO API   | http://localhost:9000              |
| MinIO Console | http://localhost:9001 (minioadmin / minioadmin) |
| Redis       | localhost:6379                     |
| Prometheus  | http://localhost:9090              |
| Grafana     | http://localhost:3001 (admin / admin) |

## 2. Установка Go-зависимостей

```bash
go mod tidy
```

Будут добавлены:
- `github.com/minio/minio-go/v7`
- `github.com/go-redis/redis/v8`
- `github.com/gorilla/websocket`
- `github.com/jung-kurt/gofpdf`
- `github.com/prometheus/client_golang`
- `github.com/google/uuid`

## 3. ENV переменные

Добавить в локальный `.env` (или экспортнуть в shell):

```env
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET=smartcourse
REDIS_ADDR=localhost:6379
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini
```

> Все сервисы реализуют graceful degrade: если ENV не задан, модуль выключается, остальные продолжают работать.

## 4. Новые API маршруты

### Файлы (MinIO)
- `POST /api/teacher/files/upload` (multipart, поле `file`) → `{ key, url, ... }`
- `GET  /api/teacher/files/:key/presign` → `{ url }`
- `DELETE /api/teacher/files/:key`

### Async задачи (Redis)
- `POST /api/teacher/jobs` → `{ "type": "echo", "payload": {...} }` → `{ job_id }`
- `GET  /api/teacher/jobs/:id` → `{ id, status, progress, result, error }`

Тип `echo` — встроенный тестовый воркер. Для реальных задач (например, AI-оценивание) зарегистрируйте handler в `internal/services/queue/worker.go` и вызовите `worker.Register("ai_evaluate", ...)` в `routes.go`.

### WebSocket
- `GET /ws?token=<JWT>` — двунаправленный канал.
  - Сервер шлёт события `{ type, payload, at }`.
  - Типы: `job_status`, `submission_submitted`, `grade_updated`.

### PDF
- `GET /api/teacher/courses/:id/report.pdf` — отчёт по курсу (метаданные, сводка, таблица оценок).

### Attachments (метаданные файлов в БД + бинарь в MinIO)
- `GET    /api/teacher/attachments?target_type=...&target_id=...` — список с pre-signed URL.
- `POST   /api/teacher/attachments` — `{ target_type, target_id?, object_key, filename, content_type, size_bytes }`
- `DELETE /api/teacher/attachments/:id` — удаляет запись + объект в MinIO.

`target_type` ∈ `assignment | submission | course | free`. Создавать запись надо после успешного `/files/upload` (есть `AttachmentsManager` который делает это автоматически).

### WS события (server → client)
- `submission_submitted` — публикуется учителю после `Submit()` студента. payload: `{ assignment_id, student_id, student_name, assignment_title, course_title }`.
- `grade_updated` — публикуется студенту после `CreateGrade` / `UpdateGrade`. payload: `{ assignment_id, assignment_title, course_title, score }`.
- `job_status` — публикуется владельцу задачи на каждом изменении прогресса.

### AI evaluate (asynchronous)
- `POST /api/teacher/jobs` с `{ "type": "ai_evaluate", "payload": { submission_text, assignment_name, criteria: [{name, description, max_score, prompt?}] } }`
- Воркер вызывает OpenRouter и возвращает JSON: `{ total, max, overall_feedback, criteria: [{name, score, max_score, feedback}] }`.
- Демо-страница: `/ai-demo` — полный цикл с прогресс-баром.

### Метрики
- `GET /metrics` — формат Prometheus (`http_requests_total`, `http_request_duration_seconds`, `jobs_*`, `ws_connected_clients`).

## 5. Frontend интеграции

| Файл | Назначение |
|------|------------|
| `lib/api/files.ts` | upload / presign / delete |
| `lib/api/jobs.ts` | enqueue / status / pollJob |
| `lib/realtime/ws.ts` | хук `useWebSocket` с reconnect |
| `components/features/files/file-uploader.tsx` | drag&drop загрузчик + карточки |
| `components/features/jobs/job-progress.tsx` | прогресс-индикатор задачи |
| `components/features/notifications/notification-bell.tsx` | колокольчик в layout |
| `components/features/reports/pdf-export-button.tsx` | универсальная кнопка экспорта |
| `app/files/page.tsx` | страница загрузки файлов |

## 6. Как добавить свой AI-воркер

```go
// internal/routes/routes.go (внутри блока worker.Register ...)
worker.Register("ai_evaluate", func(ctx context.Context, job *queue.Job, progress func(int)) (any, error) {
    var p struct {
        SubmissionID uint   `json:"submission_id"`
        Text         string `json:"text"`
    }
    if err := json.Unmarshal(job.Payload, &p); err != nil {
        return nil, err
    }
    progress(20)
    // вызов OpenRouter / ваш AI пайплайн
    progress(80)
    return map[string]any{"score": 87, "feedback": "..."}, nil
})
```

С фронтенда:
```ts
const { job_id } = await enqueueJob("ai_evaluate", { submission_id: 42, text: "..." })
// показать <JobProgress jobId={job_id} />, либо ждать события "job_status" в NotificationBell
```
