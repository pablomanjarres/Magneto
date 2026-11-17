import { describe, expect, it } from "vitest";

import { AI_LIFETIME_CAP_USD, claudeCostUsd, hasAiBudget } from "../src/index.js";

describe("claudeCostUsd", () => {
  it("prices each kind of token at the model's list price per million", () => {
    expect(claudeCostUsd({ input_tokens: 1_000_000, output_tokens: 0 })).toBeCloseTo(4);
    expect(claudeCostUsd({ input_tokens: 0, output_tokens: 1_000_000 })).toBeCloseTo(20);
    expect(
      claudeCostUsd({ input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 1_000_000 }),
    ).toBeCloseTo(5);
    expect(
      claudeCostUsd({ input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 1_000_000 }),
    ).toBeCloseTo(0.2);
  });

  it("adds them up for one call, with missing cache counts as zero", () => {
    // 10k tokens in and 2k out, the size of a résumé read: 4 cents plus 4 cents.
    expect(
      claudeCostUsd({
        input_tokens: 10_000,
        output_tokens: 2_000,
        cache_creation_input_tokens: null,
        cache_read_input_tokens: null,
      }),
    ).toBeCloseTo(0.08);
  });
});

describe("hasAiBudget", () => {
  it("lets calls through until the lifetime spend reaches the cap", () => {
    expect(AI_LIFETIME_CAP_USD).toBe(50);
    expect(hasAiBudget(0)).toBe(true);
    expect(hasAiBudget(49.99)).toBe(true);
    expect(hasAiBudget(50)).toBe(false);
    expect(hasAiBudget(73.5)).toBe(false);
  });
});
