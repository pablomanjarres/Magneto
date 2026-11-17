-- What each Claude call cost, so the app stops calling once the total reaches
-- its lifetime budget (AI_LIFETIME_CAP_USD in packages/core/src/spend.ts).

CREATE TABLE IF NOT EXISTS ai_spend (
  id             BIGSERIAL PRIMARY KEY,
  feature        TEXT NOT NULL CHECK (feature IN ('resume', 'tailor', 'assistant')),
  input_tokens   INTEGER NOT NULL,
  output_tokens  INTEGER NOT NULL,
  cost_usd       NUMERIC(12, 6) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
