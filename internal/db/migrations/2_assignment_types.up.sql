-- Добавляем новые поля в таблицу заданий для поддержки essay и test типов
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS type VARCHAR(10) NOT NULL DEFAULT 'essay';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS criteria TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS questions TEXT;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS word_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_score FLOAT NOT NULL DEFAULT 100;
