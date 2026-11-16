import { describe, expect, it } from "vitest";

import { takeToken } from "../src/index.js";

const HOUR = 60 * 60 * 1000;

describe("takeToken", () => {
  it("lets requests through up to the limit", () => {
    let hits: number[] = [];
    for (let i = 0; i < 3; i++) {
      const r = takeToken(hits, 1000 + i, 3, HOUR);
      expect(r.ok).toBe(true);
      hits = r.hits;
    }
    expect(hits).toHaveLength(3);
  });

  it("refuses the next one and says how long to wait", () => {
    const r = takeToken([0, 10, 20], 1000, 3, HOUR);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfterSeconds).toBe(Math.ceil((HOUR - 1000) / 1000));
  });

  it("forgets hits once they leave the window", () => {
    const r = takeToken([0, 10, 20], HOUR + 30, 3, HOUR);
    expect(r.ok).toBe(true);
    expect(r.hits).toEqual([HOUR + 30]);
  });

  it("never asks to wait less than a second", () => {
    const r = takeToken([0], HOUR - 1, 1, HOUR);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfterSeconds).toBe(1);
  });
});
