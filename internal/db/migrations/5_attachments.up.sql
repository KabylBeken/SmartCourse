CREATE TABLE IF NOT EXISTS attachments (
    id           SERIAL PRIMARY KEY,
    owner_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type  VARCHAR(32) NOT NULL,            -- 'assignment' | 'submission' | 'course' | 'free'
    target_id    INTEGER,                          -- nullable для 'free' (файлы из библиотеки)
    object_key   TEXT NOT NULL,                    -- путь в MinIO
    filename     TEXT NOT NULL,
    content_type VARCHAR(128) NOT NULL DEFAULT 'application/octet-stream',
    size_bytes   BIGINT NOT NULL DEFAULT 0,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_target  ON attachments (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_attachments_owner   ON attachments (owner_id);
