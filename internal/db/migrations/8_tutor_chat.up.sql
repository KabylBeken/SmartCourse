CREATE TABLE IF NOT EXISTS tutor_sessions (
    id            SERIAL PRIMARY KEY,
    student_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (student_id, assignment_id)
);

CREATE TABLE IF NOT EXISTS tutor_messages (
    id         SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES tutor_sessions(id) ON DELETE CASCADE,
    role       VARCHAR(20) NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tutor_messages_session_id ON tutor_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_student_id ON tutor_sessions(student_id);
