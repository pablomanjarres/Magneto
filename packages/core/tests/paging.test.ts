import { describe, expect, it } from "vitest";

import { PAGE_SIZE, pageOf } from "../src/index.js";

const list = Array.from({ length: 25 }, (_, i) => i + 1);

describe("pageOf", () => {
  it("shows ten items a page", () => {
    expect(PAGE_SIZE).toBe(10);
  });

  it("returns the first page", () => {
    expect(pageOf(list, 1, 10)).toEqual({ items: list.slice(0, 10), hasMore: true });
  });

  it("accumulates earlier pages on a middle page", () => {
    expect(pageOf(list, 2, 10)).toEqual({ items: list.slice(0, 20), hasMore: true });
  });

  it("reports no more on the last page", () => {
    expect(pageOf(list, 3, 10)).toEqual({ items: list, hasMore: false });
  });

  it("returns the whole list past the end", () => {
    expect(pageOf(list, 9, 10)).toEqual({ items: list, hasMore: false });
  });

  it("treats page 0, a negative page and NaN as the first page", () => {
    for (const page of [0, -2, Number.NaN]) {
      expect(pageOf(list, page, 10)).toEqual({ items: list.slice(0, 10), hasMore: true });
    }
  });

  it("handles an empty list", () => {
    expect(pageOf([], 1, 10)).toEqual({ items: [], hasMore: false });
  });
});
