import { pool } from "../pool.js";

/** The features that call Claude, as `ai_spend.feature` stores them. */
export type AiFeature = "resume" | "tailor" | "assistant";

/** Stores what one Claude call cost. */
export async function recordAiSpend(entry: {
  feature: AiFeature;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}): Promise<void> {
  await pool.query(
    "INSERT INTO ai_spend (feature, input_tokens, output_tokens, cost_usd) VALUES ($1, $2, $3, $4)",
    [entry.feature, entry.inputTokens, entry.outputTokens, entry.costUsd],
  );
}

/** Everything the app has spent on Claude, in US dollars. */
export async function totalAiSpendUsd(): Promise<number> {
  const { rows } = await pool.query<{ total: string }>(
    "SELECT COALESCE(SUM(cost_usd), 0)::text AS total FROM ai_spend",
  );
  return Number(rows[0]?.total ?? 0);
}
