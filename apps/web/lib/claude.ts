import Anthropic from "@anthropic-ai/sdk";

/** The model every Claude call in the app uses. */
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
