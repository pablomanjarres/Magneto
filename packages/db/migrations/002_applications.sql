-- Applications: the candidate's own pipeline over vacancies they applied to.
-- The brief rules out real auto-applying, so nothing here is sent anywhere.

CREATE TABLE IF NOT EXISTS applications (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id  TEXT NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  vacancy_id  TEXT NOT NULL REFERENCES vacancies (id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'applied'
                CHECK (status IN ('applied', 'in-review', 'interview', 'rejected')),
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  note        TEXT,
  -- One application per vacancy per candidate. Applying twice is the same row.
  UNIQUE (profile_id, vacancy_id)
);

CREATE INDEX IF NOT EXISTS applications_profile_idx ON applications (profile_id);
