-- The activity log: one row per thing the candidate did on the board.
-- application_id has no foreign key on purpose, so the history outlives a withdrawal.

CREATE TABLE IF NOT EXISTS application_events (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id      TEXT NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  vacancy_id      TEXT NOT NULL REFERENCES vacancies (id) ON DELETE CASCADE,
  application_id  TEXT NOT NULL,
  kind            TEXT NOT NULL CHECK (kind IN ('applied', 'moved', 'note', 'withdrawn')),
  detail          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS application_events_profile_idx
  ON application_events (profile_id, created_at DESC);
