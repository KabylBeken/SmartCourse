-- Откат миграции для типов заданий
ALTER TABLE assignments DROP COLUMN IF EXISTS type;
ALTER TABLE assignments DROP COLUMN IF EXISTS criteria;
ALTER TABLE assignments DROP COLUMN IF EXISTS questions;
ALTER TABLE assignments DROP COLUMN IF EXISTS word_count;
ALTER TABLE assignments DROP COLUMN IF EXISTS max_score;
