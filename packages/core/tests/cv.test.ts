import { describe, expect, it } from "vitest";
import type {
  CvDiff,
  CvDocument,
  CvSectionKey,
  DiffKind,
  DiffPart,
  Profile,
  TailoredProfile,
} from "@moonlight/types";

import { diffCv, diffWords, toHarvardCv } from "../src/index.js";

const EMPTY: Profile = {
  id: "p0",
  email: "ana@example.com",
  fullName: "Ana Gómez",
  skills: [],
  experience: [],
  education: [],
  expectations: { workModes: [], cities: [] },
};

const PROFILE: Profile = {
  ...EMPTY,
  id: "p1",
  email: "laura@example.com",
  fullName: "Laura Restrepo",
  city: "Medellín",
  skills: [{ name: "TypeScript" }, { name: "React" }, { name: "Node.js" }, { name: "SQL" }],
  experience: [
    {
      company: "Freelance",
      title: "Desarrolladora web",
      startDate: "2019-03",
      endDate: "2021-01",
      description: "Sitios para pymes.",
    },
    {
      company: "Rappi",
      title: "Software Engineer",
      startDate: "2023-02",
      description: "Diseñé APIs REST en Node.js. Reduje la latencia un 30%.",
    },
    {
      company: "Globant",
      title: "Frontend Developer",
      startDate: "2021-02",
      endDate: "2023-01",
      description: "- Interfaces en React\n- Pruebas con Vitest\n\n- Revisión de código",
    },
  ],
  education: [
    {
      institution: "Universidad EAFIT",
      degree: "Ingeniería de Sistemas",
      startYear: 2015,
      endYear: 2020,
    },
    { institution: "SENA", degree: "Técnico en programación", startYear: 2013, endYear: 2014 },
    { institution: "Platzi", degree: "Escuela de Data", startYear: 2024 },
    { institution: "Coursera", degree: "Machine Learning", startYear: 2019, endYear: 2020 },
  ],
};

// What the tailoring step returns: reordered and reworded, Freelance and Node.js left out.
const TAILORED: TailoredProfile = {
  vacancyId: "v1",
  headline: "Ingeniera de software con foco en APIs",
  summary: "Construyo APIs en Node.js y frontends en React.",
  experience: [
    {
      company: "Globant",
      title: "Frontend Developer",
      startDate: "2021-02",
      endDate: "2023-01",
      description: "Interfaces en React\nPruebas con Vitest\nRevisión de pull requests",
    },
    {
      company: "rappi",
      title: "software engineer",
      startDate: "2023-02",
      description: "Reduje la latencia un 30%.\nDiseñé APIs REST en Node.js.",
    },
  ],
  skills: ["React", "typescript", "SQL"],
};

const plain = toHarvardCv(PROFILE);
const tailored = toHarvardCv(PROFILE, TAILORED);

const section = (cv: CvDocument, key: CvSectionKey) => cv.sections.find((s) => s.key === key)!;
const sectionDiff = (diff: CvDiff, key: CvSectionKey) => diff.sections.find((s) => s.key === key)!;

type View = "before" | "after";
const hidden = (view: View): DiffKind => (view === "before" ? "added" : "removed");

/** What one side of a word diff reads: same + removed is before, same + added is after. */
const read = (parts: DiffPart[], view: View): string =>
  parts
    .filter((p) => p.kind !== hidden(view))
    .map((p) => p.text)
    .join("");

const readLines = (lines: DiffPart[][], view: View): string[] =>
  lines.map((line) => read(line, view)).filter(Boolean);

/** One side of a CV diff read back as a CV, with the contact line joined. */
const rebuild = (diff: CvDiff, view: View): CvDocument => ({
  name: read(diff.name, view),
  contact: [read(diff.contact, view)],
  sections: diff.sections
    .filter((s) => s.status !== hidden(view))
    .map((s) => ({
      key: s.key,
      title: s.title,
      lines: readLines(s.lines, view),
      entries: s.entries
        .filter((e) => e.status !== hidden(view))
        .map((e) => ({
          key: e.key,
          title: read(e.title, view),
          place: read(e.place, view),
          subtitle: read(e.subtitle, view),
          dates: read(e.dates, view),
          bullets: readLines(e.bullets, view),
        })),
    })),
});

const joined = (cv: CvDocument): CvDocument => ({ ...cv, contact: [cv.contact.join(" • ")] });

// The diff lists entries in the after order, so the before side is compared regardless of order.
const byKey = (cv: CvDocument): CvDocument => ({
  ...cv,
  sections: cv.sections.map((s) => ({
    ...s,
    entries: [...s.entries].sort((a, b) => a.key.localeCompare(b.key)),
  })),
});

describe("toHarvardCv", () => {
  it("lays out the plain CV as education, experience and skills under a contact line", () => {
    expect(plain.name).toBe("Laura Restrepo");
    expect(plain.contact).toEqual(["Medellín", "laura@example.com"]);
    expect(plain.sections.map((s) => [s.key, s.title])).toEqual([
      ["education", "Educación"],
      ["experience", "Experiencia"],
      ["skills", "Habilidades"],
    ]);
    expect(section(plain, "skills")).toEqual({
      key: "skills",
      title: "Habilidades",
      entries: [],
      lines: ["Técnicas: TypeScript, React, Node.js, SQL"],
    });
  });

  it("opens the tailored CV with a profile section of headline and summary", () => {
    expect(tailored.sections.map((s) => s.key)).toEqual([
      "profile",
      "education",
      "experience",
      "skills",
    ]);
    expect(tailored.sections[0]).toEqual({
      key: "profile",
      title: "Perfil",
      entries: [],
      lines: [TAILORED.headline, TAILORED.summary],
    });
  });

  it("lists positions current first, then newest, with Spanish month names", () => {
    expect(
      section(plain, "experience").entries.map((e) => [e.title, e.place, e.subtitle, e.dates]),
    ).toEqual([
      ["Rappi", "", "Software Engineer", "Febrero 2023 – Actualidad"],
      ["Globant", "", "Frontend Developer", "Febrero 2021 – Enero 2023"],
      ["Freelance", "", "Desarrolladora web", "Marzo 2019 – Enero 2021"],
