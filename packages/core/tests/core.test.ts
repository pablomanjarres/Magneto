import { describe, expect, it } from "vitest";
import type { Profile, Vacancy } from "@moonlight/types";

import { marketGaps, profileCompleteness, rankVacancies, scoreVacancy } from "../src/index.js";

const profile = (skills: string[], over: Partial<Profile> = {}): Profile => ({
  id: "p1",
  email: "a@b.co",
  fullName: "Ana",
  city: "Medellín",
  skills: skills.map((name) => ({ name })),
  experience: [{ company: "X", title: "Dev", startDate: "2023-01" }],
  education: [{ institution: "EAFIT", degree: "Ing.", startYear: 2020 }],
  expectations: {
    targetRole: "Backend",
    salaryMin: 5,
    salaryMax: 9,
    currency: "COP",
    workModes: ["remote"],
    willRelocate: false,
    cities: [],
  },
  ...over,
});

const vacancy = (id: string, must: string[], nice: string[] = []): Vacancy => ({
  id,
  title: "Dev",
  company: "ACME",
  city: "Medellín",
  workMode: "remote",
  requirements: [
    ...must.map((skill) => ({ skill, kind: "must-have" as const })),
    ...nice.map((skill) => ({ skill, kind: "nice-to-have" as const })),
  ],
});

describe("scoreVacancy", () => {
  it("gives 100 when every requirement is met and 0 when none are", () => {
    expect(scoreVacancy(profile(["TypeScript"]), vacancy("v1", ["TypeScript"])).score).toBe(100);
    expect(scoreVacancy(profile(["Go"]), vacancy("v1", ["TypeScript"])).score).toBe(0);
  });

  it("costs more to miss a must-have than a nice-to-have", () => {
    const missMust = scoreVacancy(profile(["React"]), vacancy("v1", ["TypeScript"], ["React"]));
    const missNice = scoreVacancy(
      profile(["TypeScript"]),
      vacancy("v1", ["TypeScript"], ["React"]),
    );
    expect(missNice.score).toBeGreaterThan(missMust.score);
    expect(missMust.score).toBe(25);
    expect(missNice.score).toBe(75);
  });

  it("matches skills whose spelling differs", () => {
    expect(scoreVacancy(profile(["node.js"]), vacancy("v1", ["Node JS"])).score).toBe(100);
  });

  it("is deterministic", () => {
    const a = scoreVacancy(profile(["TypeScript"]), vacancy("v1", ["TypeScript", "Go"]));
    const b = scoreVacancy(profile(["TypeScript"]), vacancy("v1", ["TypeScript", "Go"]));
    expect(a).toEqual(b);
  });

  it("scores 0 rather than dividing by zero when there are no requirements", () => {
    expect(scoreVacancy(profile(["Go"]), vacancy("v1", [])).score).toBe(0);
  });

  it("explains the score", () => {
    const r = scoreVacancy(profile(["TypeScript"]), vacancy("v1", ["TypeScript", "Go"]));
    expect(r.reason).toBe("Meets 1 of 2 requirements, including 1 of 2 must-haves.");
    expect(r.missing.map((m) => m.skill)).toEqual(["Go"]);
  });
});

describe("rankVacancies", () => {
  it("orders by score and drops vacancies that ask for nothing", () => {
    const ranked = rankVacancies(profile(["TypeScript"]), [
      vacancy("low", ["Go"]),
      vacancy("high", ["TypeScript"]),
      vacancy("empty", []),
    ]);
    expect(ranked.map((r) => r.vacancyId)).toEqual(["high", "low"]);
  });

  it("breaks ties the same way every time", () => {
    const ranked = rankVacancies(profile(["TypeScript"]), [
      vacancy("b", ["TypeScript"]),
      vacancy("a", ["TypeScript"]),
    ]);
    expect(ranked.map((r) => r.vacancyId)).toEqual(["a", "b"]);
  });
});

describe("profileCompleteness", () => {
  it("reaches 100 on a full profile", () => {
    expect(profileCompleteness(profile(["TypeScript"])).percentage).toBe(100);
  });

  it("names what is missing and never breaks on an empty profile", () => {
    const bare = profile([], {
      fullName: "",
      city: "",
      experience: [],
      education: [],
      expectations: { workModes: [], willRelocate: false, cities: [] },
    });
    const result = profileCompleteness(bare);
    expect(result.percentage).toBe(11);
    expect(result.missing).toContain("At least one skill");
    expect(result.missing).toContain("Target role");
  });
});

describe("marketGaps", () => {
  it("ranks missing skills by how many vacancies ask for them", () => {
    const gaps = marketGaps(profile(["TypeScript"]), [
      vacancy("v1", ["Go", "Docker"]),
      vacancy("v2", ["Go"]),
      vacancy("v3", ["TypeScript"]),
    ]);
    expect(gaps[0]?.skill).toBe("Go");
    expect(gaps[0]?.demandCount).toBe(2);
    expect(gaps[0]?.sharePercent).toBe(67);
  });

  it("returns nothing for an empty vacancy set instead of throwing", () => {
    expect(marketGaps(profile(["TypeScript"]), [])).toEqual([]);
  });
});
