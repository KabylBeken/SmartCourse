CREATE TABLE IF NOT EXISTS schedule_events (
    id           SERIAL PRIMARY KEY,
    teacher_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id    INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE SET NULL,
    title        VARCHAR(255) NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    start_time   TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time     TIMESTAMP WITH TIME ZONE,
    all_day      BOOLEAN NOT NULL DEFAULT FALSE,
    type         VARCHAR(50) NOT NULL DEFAULT 'lesson',
    color        VARCHAR(20) NOT NULL DEFAULT '',
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_events_teacher_id ON schedule_events(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_start_time  ON schedule_events(start_time);
CREATE INDEX IF NOT EXISTS idx_schedule_events_course_id   ON schedule_events(course_id);
