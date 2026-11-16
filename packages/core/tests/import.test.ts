import { describe, expect, it } from "vitest";
import type { ImportedProfile, Profile } from "@moonlight/types";

import {
  canonicalLinkedInUrl,
  isLinkedInProfileUrl,
  mapLinkedInProfile,
  mergeImport,
  toYearMonth,
} from "../src/index.js";

// The shape atomus/linkedin-profile-scraper returns, trimmed to what we read.
const DUMP = {
  status: "success",
  profile: {
    full_name: "Laura Restrepo",
    headline: "Frontend Developer",
    location: { city: "Medellín", short: "Medellín, Antioquia" },
    skills: ["React", "TypeScript", "react", "Node.js"],
    educations: [
      {
        school: { name: "Universidad EAFIT" },
        degree_name: "Ingeniería de Sistemas",
        field_of_study: "Software",
        date: { start: "2016", end: "2021" },
      },
    ],
    position_groups: [
      {
        company: { name: "Globant" },
        profile_positions: [
          {
            title: "Frontend Developer",
            date: { start: "Mar 2022", end: null },
            description: "React",
          },
          {
            title: "Intern",
            date: { start: { year: 2021, month: 6 }, end: { year: 2022, month: 2 } },
          },
        ],
      },
    ],
  },
};

const empty: Profile = {
  id: "p1",
  email: "a@b.co",
  fullName: "Laura",
  skills: [],
  experience: [],
  education: [],
  expectations: { workModes: [], cities: [] },
};

describe("LinkedIn URLs", () => {
  it("accepts a profile URL and canonicalises it", () => {
    expect(isLinkedInProfileUrl("linkedin.com/in/laura")).toBe(false);
    expect(isLinkedInProfileUrl("https://co.linkedin.com/in/laura-restrepo?trk=x")).toBe(true);
    expect(canonicalLinkedInUrl("http://linkedin.com/in/laura-restrepo/")).toBe(
      "https://www.linkedin.com/in/laura-restrepo/",
    );
  });

  it("rejects anything that is not a member profile", () => {
    expect(isLinkedInProfileUrl("https://www.linkedin.com/company/globant/")).toBe(false);
    expect(isLinkedInProfileUrl("https://evil.com/in/laura")).toBe(false);
    expect(canonicalLinkedInUrl("not a url")).toBeNull();
  });
});

describe("toYearMonth", () => {
  it("reads every date form the scraper and résumés use", () => {
    expect(toYearMonth("2023-2")).toBe("2023-02");
    expect(toYearMonth("Feb 2023")).toBe("2023-02");
    expect(toYearMonth("dic. 2020")).toBe("2020-12");
    expect(toYearMonth("2019")).toBe("2019-01");
    expect(toYearMonth({ year: 2021, month: 6 })).toBe("2021-06");
    expect(toYearMonth(null)).toBe("");
  });
});

describe("mapLinkedInProfile", () => {
  const imported = mapLinkedInProfile(DUMP);

  it("carries company, title, dates and description, and marks a position with no end as current", () => {
    expect(imported.experience).toEqual([
      {
        company: "Globant",
        title: "Frontend Developer",
        startDate: "2022-03",
        endDate: undefined,
        description: "React",
        source: "linkedin",
      },
      {
        company: "Globant",
        title: "Intern",
        startDate: "2021-06",
        endDate: "2022-02",
        description: undefined,
        source: "linkedin",
      },
    ]);
  });

  it("reads education with institution, degree and years", () => {
    expect(imported.education).toEqual([
      {
        institution: "Universidad EAFIT",
        degree: "Ingeniería de Sistemas, Software",
        startYear: 2016,
        endYear: 2021,
        source: "linkedin",
      },
    ]);
  });

  it("normalises and deduplicates skills", () => {
    expect(imported.skills.map((s) => s.name)).toEqual(["React", "TypeScript", "Node.js"]);
  });

  it("keeps a school listed without a degree, for the candidate to complete", () => {
    const only = mapLinkedInProfile({
      profile: {
        educations: [{ school: { name: "Harvard University" }, date: { start: "1973" } }],
      },
    });
    expect(only.education).toEqual([
      {
        institution: "Harvard University",
        degree: "",
        startYear: 1973,
        endYear: undefined,
        source: "linkedin",
      },
    ]);
  });

  it("leaves education empty when the dump has none", () => {
    expect(mapLinkedInProfile({ profile: {} }).education).toEqual([]);
  });
});

describe("mergeImport", () => {
  it("adds only what is new and never overwrites what the candidate typed", () => {
    const profile: Profile = {
      ...empty,
      city: "Bogotá",
      skills: [{ name: "react" }],
      experience: [{ company: "globant", title: "frontend developer", startDate: "2022-03" }],
    };
    const { profile: merged, added } = mergeImport(profile, mapLinkedInProfile(DUMP));
    expect(added).toEqual({ experience: 1, education: 1, skills: 2 });
    expect(merged.city).toBe("Bogotá");
    expect(merged.skills.map((s) => s.name)).toEqual(["react", "TypeScript", "Node.js"]);
    expect(merged.experience.at(-1)?.source).toBe("linkedin");
  });

  it("merges a résumé after LinkedIn without duplicating records", () => {
    const first = mergeImport(empty, mapLinkedInProfile(DUMP)).profile;
    const resume: ImportedProfile = {
      source: "resume",
      experience: [{ company: "Globant", title: "Frontend Developer", startDate: "2022-03" }],
      education: [],
      skills: [{ name: "node js" }, { name: "Figma" }],
    };
    const { profile, added } = mergeImport(first, resume);
    expect(added).toEqual({ experience: 0, education: 0, skills: 1 });
    expect(profile.skills.at(-1)).toEqual({ name: "Figma", source: "resume" });
  });
});
