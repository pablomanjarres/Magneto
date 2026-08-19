-- Self-registration. The candidate creates their own account and fills their
-- own profile: delivery 1 has no LinkedIn scraping, so nothing arrives
-- pre-filled and the wizard is the only way in.
--
-- The credential lives on the profile rather than in a second table, because a
-- candidate is exactly one profile here. Nullable on purpose: the seeded demo
-- profile existed before this migration, and a profile without a password
-- simply cannot be signed into.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  profile_id  TEXT NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_profile_idx ON sessions (profile_id);
