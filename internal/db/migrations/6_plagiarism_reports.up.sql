CREATE TABLE IF NOT EXISTS plagiarism_reports (
    id             SERIAL PRIMARY KEY,
    assignment_id  INTEGER     NOT NULL,
    scan_id        VARCHAR(64) NOT NULL,
    pairs          TEXT        NOT NULL DEFAULT '[]',
    doc_count      INTEGER     NOT NULL DEFAULT 0,
    avg_similarity REAL        NOT NULL DEFAULT 0,
    max_similarity REAL        NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_plagiarism_assignment ON plagiarism_reports(assignment_id);
CREATE INDEX IF NOT EXISTS idx_plagiarism_created ON plagiarism_reports(created_at DESC);
