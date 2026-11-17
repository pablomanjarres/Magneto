import Anthropic from "@anthropic-ai/sdk";
import { claudeCostUsd, hasAiBudget, type ClaudeUsage } from "@moonlight/core";
import { recordAiSpend, totalAiSpendUsd, type AiFeature } from "@moonlight/db";

import { UserFacingError } from "./errors";

/** The model every Claude call in the app uses. Its prices are in packages/core/src/spend.ts. */
export const CLAUDE_MODEL = "claude-opus-5-5";

let client: Anthropic | undefined;

/**
 * The one Claude client, created on first use so the app still starts without
 * a key; only the routes that need Claude fail, and they say why.
 */
export function claude(): Anthropic {
  if (!process.env["ANTHROPIC_API_KEY"]) {
    throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env.local.");
  }
  const workspace = process.env["ANTHROPIC_WORKSPACE_ID"];
  client ??= new Anthropic(
    workspace ? { defaultHeaders: { "anthropic-workspace-id": workspace } } : {},
  );
  return client;
}

/**
 * Runs one Claude call inside the app's lifetime budget: refuses once the
 * recorded spend reaches it, and records what the call cost.
 */
export async function budgeted<T extends { usage: ClaudeUsage }>(
  feature: AiFeature,
  call: () => Promise<T>,
): Promise<T> {
  if (!hasAiBudget(await totalAiSpendUsd())) {
    throw new UserFacingError(
      "La IA de Moon Light llegó a su límite de uso. El resto de la aplicación sigue funcionando.",
    );
  }
  const response = await call();
  await recordAiSpend({
    feature,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    costUsd: claudeCostUsd(response.usage),
  });
  return response;
}
