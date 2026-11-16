-- The résumé's opening line and short summary, saved once the candidate accepts them.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS summary  TEXT;
