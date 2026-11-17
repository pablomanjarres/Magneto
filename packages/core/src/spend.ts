/**
 * What the app's Claude calls cost and when they must stop. Pure, so the price
 * math and the cap are tested without the API or a database.
 */

/** claude-opus-5-5 list prices in US dollars per million tokens. They change with the model. */
export const CLAUDE_PRICE_PER_MTOK = {
  input: 4,
  output: 20,
  cacheWrite: 5,
  cacheRead: 0.2,
} as const;

/** Lifetime budget for every Claude call the app makes; once spent, the AI features stop. */
export const AI_LIFETIME_CAP_USD = 50;

/** The token counts a Claude response reports in `usage`. */
export interface ClaudeUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

/** What one response cost, in US dollars. */
export function claudeCostUsd(usage: ClaudeUsage): number {
  const price = CLAUDE_PRICE_PER_MTOK;
  const microDollars =
    usage.input_tokens * price.input +
    usage.output_tokens * price.output +
    (usage.cache_creation_input_tokens ?? 0) * price.cacheWrite +
    (usage.cache_read_input_tokens ?? 0) * price.cacheRead;
  return microDollars / 1_000_000;
}

/** Whether another call may start, given everything spent so far. */
export const hasAiBudget = (spentUsd: number): boolean => spentUsd < AI_LIFETIME_CAP_USD;
