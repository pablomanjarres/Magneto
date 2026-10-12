import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Profile, Vacancy } from "@moonlight/types";

import {
  comparisonBlockers,
  marketGaps,
  parseProfile,
  profileCompleteness,
  rankVacancies,
  scoreFromWeights,
  scoreVacancy,
  topGaps,
} from "../src/index.js";

const ok = (result: ReturnType<typeof parseProfile>): Profile => {
  if ("errors" in result) throw new Error(result.errors.join(", "));
  return result.profile;
};

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

describe("topGaps", () => {
  const gaps = (skills: string[], must: string[], nice: string[] = []) =>
    topGaps(scoreVacancy(profile(skills), vacancy("v1", must, nice))).map((r) => r.skill);

  it("returns at most three", () => {
    expect(gaps([], ["A", "B", "C", "D"], ["E"])).toHaveLength(3);
  });

  it("puts must-haves first, then orders by name", () => {
    expect(gaps([], ["Rust", "Go"], ["Elixir"])).toEqual(["Go", "Rust", "Elixir"]);
  });

  it("returns nothing on a full match", () => {
    expect(gaps(["Go"], ["Go"])).toEqual([]);
  });

  it("is stable", () => {
    const r = scoreVacancy(profile([]), vacancy("v1", ["Rust", "Go"], ["Elixir", "Ada"]));
    expect(topGaps(r)).toEqual(topGaps(r));
    expect(r.missing.map((m) => m.skill)).toEqual(["Rust", "Go", "Elixir", "Ada"]);
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

  it("ranks a vacancy outside the city lower when the candidate won't relocate", () => {
    const ranked = rankVacancies(profile(["TypeScript", "React"]), [
      { ...vacancy("bogota", ["TypeScript"]), city: "Bogotá", workMode: "onsite" },
      vacancy("medellin", ["TypeScript", "React"], ["Go"]),
    ]);
    expect(ranked.map((r) => [r.vacancyId, r.score])).toEqual([
      ["medellin", 86],
      ["bogota", 80],
    ]);
  });
});

describe("scoreVacancy location", () => {
  const bogota = (workMode: Vacancy["workMode"], must: string[] = ["TypeScript"]): Vacancy => ({
    ...vacancy("bog", must),
    city: "Bogotá",
    workMode,
  });
  const expectations = profile([]).expectations;

  it("takes 20 points off an onsite vacancy in another city", () => {
    const result = scoreVacancy(profile(["TypeScript"]), bogota("onsite"));
    expect(result.score).toBe(80);
    expect(result.location).toEqual({ city: "Bogotá", points: 20 });
  });

  it("takes 20 points off a hybrid vacancy in another city", () => {
    expect(scoreVacancy(profile(["TypeScript"]), bogota("hybrid")).score).toBe(80);
  });

  it("leaves a remote vacancy alone", () => {
    const result = scoreVacancy(profile(["TypeScript"]), bogota("remote"));
    expect(result.score).toBe(100);
    expect(result.location).toBeUndefined();
  });

  it("treats Medellin and Medellín as the same city", () => {
    const result = scoreVacancy(profile(["TypeScript"], { city: " medellin " }), {
      ...vacancy("med", ["TypeScript"]),
      workMode: "onsite",
    });
    expect(result.score).toBe(100);
    expect(result.location).toBeUndefined();
  });

  it("leaves the score alone unless the candidate said no and has a city", () => {
    const willing = profile(["TypeScript"], {
      expectations: { ...expectations, willRelocate: true },
    });
    const unanswered = profile(["TypeScript"], {
      expectations: { ...expectations, willRelocate: undefined },
    });
    const noCity = profile(["TypeScript"], { city: undefined });
    for (const p of [willing, unanswered, noCity]) {
      const result = scoreVacancy(p, bogota("onsite"));
      expect(result.score).toBe(100);
      expect(result.location).toBeUndefined();
    }
  });

  it("builds the same number from weights that scoreVacancy shows", () => {
    expect(scoreFromWeights(4, 5)).toBe(80);
    expect(scoreFromWeights(4, 5, { city: "Bogotá", points: 20 })).toBe(60);
    expect(scoreFromWeights(1, 10, { city: "Bogotá", points: 20 })).toBe(0);
    expect(scoreFromWeights(0, 0)).toBe(0);
  });

  it("never goes below 0", () => {
    const result = scoreVacancy(profile(["Go"]), bogota("onsite"));
    expect(result.score).toBe(0);
  });
});

describe("profileCompleteness", () => {
  it("reaches 100 on a full profile", () => {
    expect(profileCompleteness(profile(["TypeScript"])).percentage).toBe(100);
  });

  it("reads 0 and names what is missing on a profile with no data", () => {
    const bare = profile([], {
      fullName: "",
      city: "",
      experience: [],
      education: [],
      expectations: { workModes: [], cities: [] },
    });
    const result = profileCompleteness(bare);
    expect(result.percentage).toBe(0);
    expect(result.missing).toContain("At least one skill");
    expect(result.missing).toContain("Relocation");
  });

  it("counts only the name on a just-registered profile", () => {
    const fresh = ok(parseProfile({ id: "p1", email: "a@b.co", fullName: "Ana" }));
    expect(profileCompleteness(fresh).percentage).toBe(11);
  });

  it("counts relocation answered no as filled", () => {
    const p = profile(["TypeScript"], {
      expectations: { workModes: ["remote"], willRelocate: false, cities: [] },
    });
    expect(profileCompleteness(p).missing).not.toContain("Relocation");
  });

  it("rises when a missing field is filled", () => {
    const fresh = ok(parseProfile({ id: "p1", email: "a@b.co", fullName: "Ana" }));
    const withCity = ok(parseProfile({ id: "p1", email: "a@b.co", fullName: "Ana", city: "Cali" }));
    expect(profileCompleteness(withCity).percentage).toBeGreaterThan(
      profileCompleteness(fresh).percentage,
    );
  });

  it("reaches 100 on the seeded candidate", () => {
    const seed: unknown = JSON.parse(
      readFileSync(
        new URL("../../../data/sample-profiles/candidate.json", import.meta.url),
        "utf8",
      ),
    );
    expect(profileCompleteness(ok(parseProfile(seed))).percentage).toBe(100);
  });
});

describe("comparisonBlockers", () => {
  it("blocks the comparison while the profile has no skills", () => {
    expect(comparisonBlockers(profile([]))).toEqual(["At least one skill"]);
  });

  it("lets a profile with one skill compare", () => {
    expect(comparisonBlockers(profile(["TypeScript"]))).toEqual([]);
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
