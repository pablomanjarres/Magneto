-- Moon Light schema. Forward only: never edit a migration that has run, add the next one.

CREATE TABLE IF NOT EXISTS vacancies (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  company     TEXT NOT NULL,
  city        TEXT NOT NULL,
  work_mode   TEXT NOT NULL CHECK (work_mode IN ('remote', 'hybrid', 'onsite')),
  salary_min  INTEGER,
  salary_max  INTEGER,
  currency    TEXT
);

CREATE TABLE IF NOT EXISTS vacancy_requirements (
  vacancy_id  TEXT NOT NULL REFERENCES vacancies (id) ON DELETE CASCADE,
  skill       TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('must-have', 'nice-to-have')),
  PRIMARY KEY (vacancy_id, skill)
);

-- The profile sub-objects are read and written whole, never queried field by field,
-- so they stay as JSONB instead of four more tables.
CREATE TABLE IF NOT EXISTS profiles (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  city          TEXT,
  skills        JSONB NOT NULL DEFAULT '[]',
  experience    JSONB NOT NULL DEFAULT '[]',
  education     JSONB NOT NULL DEFAULT '[]',
  expectations  JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
