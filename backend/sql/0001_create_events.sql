CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    source TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    patron_id TEXT,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events (creator_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events (type);
