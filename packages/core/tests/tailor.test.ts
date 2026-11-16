import { describe, expect, it } from "vitest";
import type { Profile, TailoredProfile } from "@moonlight/types";

import { acceptTailored, checkTailored } from "../src/index.js";

const PROFILE: Profile = {
  id: "p1",
  email: "laura@example.com",
  fullName: "Laura Restrepo",
  skills: [{ name: "React" }, { name: "Node.js" }, { name: "SQL" }],
  experience: [
    {
      company: "Globant",
      title: "Frontend Developer",
      startDate: "2021-02",
      endDate: "2023-06",
      description: "Interfaces en React.",
    },
    { company: "Rappi", title: "Software Engineer", startDate: "2023-07", description: "APIs." },
  ],
  education: [],
  expectations: { workModes: [], cities: [] },
};

const tailored = (overrides: Partial<TailoredProfile> = {}): TailoredProfile => ({
  vacancyId: "v1",
  headline: "Ingeniera de software con foco en APIs",
  summary: "Construyo APIs y frontends.",
  experience: [...PROFILE.experience],
  skills: ["React", "Node.js"],
  ...overrides,
});

describe("checkTailored", () => {
  it("accepts reordered entries, reworded descriptions and respelled skills", () => {
    const [globant, rappi] = PROFILE.experience;
    const result = checkTailored(
      PROFILE,
      tailored({
        experience: [
          { ...rappi!, description: "Diseñé APIs REST en Node.js." },
          { ...globant!, company: "globant", title: "frontend developer" },
        ],
        skills: ["nodejs", "SQL", "react"],
      }),
    );
    expect(result).toEqual({ ok: true, problems: [] });
  });

  it("flags an experience entry the profile does not have", () => {
    const result = checkTailored(
      PROFILE,
      tailored({
        experience: [{ company: "Google", title: "Staff Engineer", startDate: "2020-01" }],
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.problems).toEqual([
      'La experiencia "Staff Engineer en Google (2020-01)" no está en tu perfil.',
    ]);
  });

  it("flags a changed date on a real entry", () => {
    const [globant] = PROFILE.experience;
    const result = checkTailored(
      PROFILE,
      tailored({ experience: [{ ...globant!, startDate: "2019-02" }] }),
    );
    expect(result.ok).toBe(false);
    expect(result.problems).toHaveLength(1);
  });

  it("flags an ongoing role turned into a finished one", () => {
    const [, rappi] = PROFILE.experience;
    const result = checkTailored(
      PROFILE,
      tailored({ experience: [{ ...rappi!, endDate: "2024-01" }] }),
    );
    expect(result.ok).toBe(false);
  });

  it("flags a repeated entry", () => {
    const [globant] = PROFILE.experience;
    const result = checkTailored(PROFILE, tailored({ experience: [globant!, { ...globant! }] }));
    expect(result.problems).toEqual([
      'La experiencia "Frontend Developer en Globant (2021-02)" aparece repetida.',
    ]);
  });

  it("flags a skill the profile does not have", () => {
    const result = checkTailored(PROFILE, tailored({ skills: ["React", "Kubernetes"] }));
    expect(result).toEqual({
      ok: false,
      problems: ['La habilidad "Kubernetes" no está en tu perfil.'],
    });
  });
});

describe("acceptTailored", () => {
  const own: Profile = {
    id: "p1",
    email: "a@b.co",
    fullName: "Laura Restrepo",
    skills: [{ name: "React" }, { name: "SQL" }, { name: "Figma", source: "linkedin" }],
    experience: [
      { company: "Nequi", title: "Data Intern", startDate: "2026-11", description: "Old wording." },
      {
        company: "Globant",
        title: "Frontend Developer",
        startDate: "2022-03",
        endDate: "2024-01",
        source: "resume",
      },
      { company: "Freelance", title: "Web Developer", startDate: "2020-01", endDate: "2021-12" },
    ],
    education: [{ institution: "EAFIT", degree: "Ingeniería", startYear: 2016 }],
    expectations: { workModes: [], cities: [] },
  };
  const version: TailoredProfile = {
    headline: "",
    summary: "",
    experience: [
      {
        company: "Globant",
        title: "Frontend Developer",
        startDate: "2022-03",
        endDate: "2024-01",
        description: "New wording.",
      },
      { company: "Nequi", title: "Data Intern", startDate: "2026-11", description: "Old wording." },
    ],
    skills: ["SQL", "React"],
  };

  it("makes the version's wording, order and omissions the profile's own", () => {
    const next = acceptTailored(own, version);
    expect(next.experience).toEqual([
      {
        company: "Globant",
        title: "Frontend Developer",
        startDate: "2022-03",
        endDate: "2024-01",
        description: "New wording.",
        source: "resume",
      },
      own.experience[0],
    ]);
    expect(next.skills).toEqual([{ name: "SQL" }, { name: "React" }]);
    expect(next.education).toEqual(own.education);
    expect(next.headline).toBeUndefined();
  });

  it("keeps a headline and summary the version adds, and the profile's own when it adds none", () => {
    const written = acceptTailored(own, {
      ...version,
      headline: "Frontend con datos",
      summary: "Construyo interfaces.",
    });
    expect([written.headline, written.summary]).toEqual([
      "Frontend con datos",
      "Construyo interfaces.",
    ]);
    const kept = acceptTailored({ ...own, headline: "Mía", summary: "Mi resumen." }, version);
    expect([kept.headline, kept.summary]).toEqual(["Mía", "Mi resumen."]);
  });
});
