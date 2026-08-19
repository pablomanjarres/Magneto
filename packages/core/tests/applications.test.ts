import { describe, expect, it } from "vitest";
import type { Application, Profile, Vacancy } from "@moonlight/types";

import {
  ALLOWED_MOVES,
  APPLICATION_STATUSES,
  applicationCards,
  canMove,
  groupByStatus,
  isApplicationStatus,
} from "../src/index.js";

const profile: Profile = {
  id: "p1",
  email: "a@b.co",
  fullName: "Ana",
  city: "Medellín",
  skills: [{ name: "TypeScript" }],
  experience: [],
  education: [],
  expectations: { workModes: ["remote"], willRelocate: false, cities: [] },
};

const vacancy = (id: string, skills: string[]): Vacancy => ({
  id,
  title: `Job ${id}`,
  company: "ACME",
  city: "Medellín",
  workMode: "remote",
  requirements: skills.map((skill) => ({ skill, kind: "must-have" as const })),
});

const application = (id: string, vacancyId: string, status: Application["status"]): Application => ({
  id,
  profileId: "p1",
  vacancyId,
  status,
  appliedAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
});

describe("the status machine", () => {
  it("moves forward through the pipeline and out to rejected", () => {
    expect(canMove("applied", "in-review")).toBe(true);
    expect(canMove("in-review", "interview")).toBe(true);
    expect(canMove("interview", "rejected")).toBe(true);
    expect(canMove("rejected", "applied")).toBe(true);
  });

  it("refuses to skip a step or to stand still", () => {
    expect(canMove("applied", "interview")).toBe(false);
    expect(canMove("applied", "applied")).toBe(false);
    expect(canMove("rejected", "interview")).toBe(false);
  });

  it("leaves no status stranded: every one can still be reached", () => {
    const reachable = new Set(Object.values(ALLOWED_MOVES).flat());
    expect([...APPLICATION_STATUSES].every((s) => reachable.has(s))).toBe(true);
  });

  it("guards the API boundary against anything else", () => {
    expect(isApplicationStatus("interview")).toBe(true);
    expect(isApplicationStatus("hired")).toBe(false);
    expect(isApplicationStatus(null)).toBe(false);
    expect(isApplicationStatus(3)).toBe(false);
  });
});

describe("applicationCards", () => {
  const vacancies = [vacancy("v1", ["TypeScript"]), vacancy("v2", ["Go"])];

  it("carries the same score the ranked list shows", () => {
    const [card] = applicationCards(profile, [application("a1", "v1", "applied")], vacancies);
    expect(card?.score).toBe(100);
    expect(card?.vacancy.title).toBe("Job v1");
  });

  it("drops an application whose vacancy is gone rather than half-rendering it", () => {
    const cards = applicationCards(profile, [application("a1", "ghost", "applied")], vacancies);
    expect(cards).toEqual([]);
  });

  it("orders by column, then score, then id", () => {
    const cards = applicationCards(
      profile,
      [
        application("a3", "v2", "applied"),
        application("a2", "v1", "interview"),
        application("a1", "v1", "applied"),
      ],
      vacancies,
    );
    expect(cards.map((c) => c.id)).toEqual(["a1", "a3", "a2"]);
  });
});

describe("groupByStatus", () => {
  it("always returns the four columns, empty ones included", () => {
    const columns = groupByStatus(
      applicationCards(profile, [application("a1", "v1", "interview")], [vacancy("v1", ["Go"])]),
    );
    expect(columns.map((c) => c.status)).toEqual([...APPLICATION_STATUSES]);
    expect(columns.map((c) => c.cards.length)).toEqual([0, 0, 1, 0]);
    expect(columns[2]?.label).toBe("Interview");
  });
});
