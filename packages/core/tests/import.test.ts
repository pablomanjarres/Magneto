import { describe, expect, it } from "vitest";
import type { ImportedProfile, Profile } from "@moonlight/types";

import {
  applyImport,
  canonicalLinkedInUrl,
  dedupeSkills,
  importMode,
  isLinkedInProfileUrl,
  mapLinkedInProfile,
  samePerson,
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

describe("dedupeSkills", () => {
  it("collapses LinkedIn's qualifiers, .js suffixes and acronyms into one skill", () => {
    expect(
      dedupeSkills([
        "Python (Programming Language)",
        "Python",
        "React.js",
        "React",
        "Model Context Protocol (MCP)",
        "MCP",
        "C++",
        "C#",
        "C",
      ]),
    ).toEqual(["Python", "React.js", "Model Context Protocol (MCP)", "C++", "C#", "C"]);
  });

  it("keeps a skill that only shares an acronym's first letters", () => {
    expect(dedupeSkills(["Retrieval-Augmented Generation (RAG)", "RAG with MongoDB"])).toEqual([
      "Retrieval-Augmented Generation (RAG)",
      "RAG with MongoDB",
    ]);
  });
});

describe("samePerson", () => {
  it("ignores case, accents and middle names", () => {
    expect(samePerson("Laura Restrepo", "laura restrepo")).toBe(true);
    expect(samePerson("Laura Restrepo", "Laura Sofía Restrepo Gómez")).toBe(true);
  });

  it("tells two people apart even when they share a first name", () => {
    expect(samePerson("Ana Gómez", "Laura Restrepo")).toBe(false);
    expect(samePerson("Ana Gómez", "Ana Restrepo")).toBe(false);
  });
});

// The demo profile: someone else's data, which an import must not pile onto.
const ana: Profile = {
  id: "p1",
  email: "ana@example.com",
  fullName: "Ana Gómez",
  city: "Bogotá",
  skills: [{ name: "Git" }],
  experience: [{ company: "Sofka", title: "Frontend Developer", startDate: "2023-02" }],
  education: [{ institution: "Universidad de los Andes", degree: "Ingeniería", startYear: 2015 }],
  expectations: { targetRole: "Full Stack Developer", workModes: ["remote"], cities: ["Bogotá"] },
};

const linkedin: ImportedProfile = {
  source: "linkedin",
  fullName: "Laura Restrepo",
  city: "Medellín",
  experience: [
    {
      company: "Acme Labs",
      title: "Founder",
      startDate: "2026-01",
      description: "Acme Labs builds tools.\nTwo products in one stack:",
    },
    { company: "Globant", title: "Intern", startDate: "2021-06", endDate: "2022-02" },
  ],
  education: [
    {
      institution: "Universidad EAFIT",
      degree: "Ingeniería de Sistemas",
      startYear: 2016,
      endYear: 2021,
    },
  ],
  skills: [
    { name: "Python (Programming Language)" },
    { name: "React.js" },
    { name: "Model Context Protocol (MCP)" },
  ],
};

const resume: ImportedProfile = {
  source: "resume",
  fullName: "Laura Restrepo",
  email: "laura@example.com",
  experience: [
    {
      company: "Acme Labs",
      title: "Founder and Software Engineer",
      startDate: "2026-01",
      description: "Built the API.\nShipped the CLI.",
    },
    { company: "Globant", title: "Frontend Developer", startDate: "2022-03" },
  ],
  education: [{ institution: "EAFIT", degree: "Ingeniería de Sistemas", startYear: 2016 }],
  skills: [{ name: "Python" }, { name: "React" }, { name: "MCP" }, { name: "Figma" }],
};

const laura: Profile = { ...empty, fullName: "Laura Restrepo", email: "" };

describe("importMode", () => {
  it("replaces a profile that belongs to someone else", () => {
    expect(importMode(ana, linkedin)).toBe("replace");
  });

  it("completes the same person's profile, or one with no name to compare", () => {
    expect(importMode(laura, resume)).toBe("complement");
    expect(importMode(ana, { ...resume, fullName: undefined })).toBe("complement");
    expect(importMode({ ...ana, fullName: "" }, linkedin)).toBe("complement");
  });
});

describe("applyImport, replacing", () => {
  it("swaps in the new person entirely: name, contact, entries and preferences", () => {
    const { profile, removed } = applyImport(ana, mapLinkedInProfile(DUMP), "replace");
    expect(profile.id).toBe("p1");
    expect(profile.fullName).toBe("Laura Restrepo");
    expect(profile.email).toBe(""); // LinkedIn has no e-mail; the review asks for it
    expect(profile.city).toBe("Medellín");
    expect(profile.experience.map((e) => e.title)).toEqual(["Frontend Developer", "Intern"]);
    expect(profile.education.map((e) => e.institution)).toEqual(["Universidad EAFIT"]);
    expect(profile.skills.map((s) => s.name)).toEqual(["React", "TypeScript", "Node.js"]);
    expect(profile.expectations).toEqual({ workModes: [], cities: [] });
    expect(removed).toEqual({ experience: 1, education: 1, skills: 1 });
  });
});

describe("applyImport, completing", () => {
  it("joins the same job from LinkedIn and a résumé into one entry with the résumé's wording", () => {
    const first = applyImport(laura, linkedin, "complement").profile;
    const { profile, added, joined } = applyImport(first, resume, "complement");

    expect(profile.experience.map((e) => `${e.company} · ${e.title}`)).toEqual([
      "Acme Labs · Founder and Software Engineer",
      "Globant · Intern",
      "Globant · Frontend Developer",
    ]);
    expect(profile.experience[0]).toMatchObject({
      description: "Built the API.\nShipped the CLI.",
      source: "resume",
    });
    expect(profile.education).toEqual([
      {
        institution: "Universidad EAFIT",
        degree: "Ingeniería de Sistemas",
        startYear: 2016,
        endYear: 2021,
        source: "resume",
      },
    ]);
    expect(profile.skills.map((s) => s.name)).toEqual([
      "Python",
      "React.js",
      "Model Context Protocol (MCP)",
      "Figma",
    ]);
    expect(added).toEqual({ experience: 1, education: 0, skills: 1 });
    expect(joined).toEqual({ experience: 1, education: 1, skills: 3 });
  });
