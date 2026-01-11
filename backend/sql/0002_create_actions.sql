CREATE TABLE IF NOT EXISTS actions (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id),
    action_type TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    patron_id TEXT,
    metadata JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actions_creator_id ON actions (creator_id);
CREATE INDEX IF NOT EXISTS idx_actions_type ON actions (action_type);
