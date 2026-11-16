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
    ]);

    const longRunning = toHarvardCv({
      ...EMPTY,
      experience: [
        { company: "Proyecto", title: "Consultora", startDate: "2020-01", endDate: "2021-06" },
        { company: "Bancolombia", title: "Analista", startDate: "2018-05" },
      ],
    });
    expect(section(longRunning, "experience").entries.map((e) => e.title)).toEqual([
      "Bancolombia",
      "Proyecto",
    ]);
  });

  it("lists studies ongoing first, then by end year and start year", () => {
    expect(section(plain, "education").entries).toEqual([
      {
        key: "edu:platzi|escueladedata",
        title: "Platzi",
        place: "",
        subtitle: "Escuela de Data",
        dates: "2024 – Actualidad",
        bullets: [],
      },
      expect.objectContaining({ title: "Coursera", dates: "2019 – 2020" }),
      expect.objectContaining({ title: "Universidad EAFIT", dates: "2015 – 2020" }),
      expect.objectContaining({ title: "SENA", dates: "2013 – 2014" }),
    ]);
  });

  it("drops a missing date cleanly and shows an unreadable one as written", () => {
    const cv = toHarvardCv({
      ...EMPTY,
      experience: [
        { company: "A", title: "Año sin mes", startDate: "2019", endDate: "2020-12" },
        { company: "B", title: "Sin inicio", startDate: "", endDate: "2024-01" },
        { company: "C", title: "Sin fechas", startDate: "" },
        { company: "D", title: "Texto libre", startDate: "Feb 2023", endDate: "2023-13" },
      ],
      education: [
        { institution: "E", degree: "Solo fin", startYear: 0, endYear: 2018 },
        { institution: "F", degree: "Sin años", startYear: 0 },
      ],
    });
    const dates = (key: CvSectionKey) =>
      Object.fromEntries(section(cv, key).entries.map((e) => [e.subtitle, e.dates]));
    expect(dates("experience")).toEqual({
      "Año sin mes": "2019 – Diciembre 2020",
      "Sin inicio": "Enero 2024",
      "Sin fechas": "Actualidad",
      "Texto libre": "Feb 2023 – 2023",
    });
    expect(dates("education")).toEqual({ "Solo fin": "2018", "Sin años": "" });
  });

  it("shows a span that starts and ends in the same month or year once", () => {
    const cv = toHarvardCv({
      ...EMPTY,
      experience: [{ company: "A", title: "B", startDate: "2020-03", endDate: "2020-03" }],
      education: [{ institution: "C", degree: "Diplomado", startYear: 2021, endYear: 2021 }],
    });
    expect(cv.sections.map((s) => s.entries[0]?.dates)).toEqual(["2021", "Marzo 2020"]);
  });

  it("splits a description into one bullet per line, or per sentence when it is one line", () => {
    const bullets = (description: string | undefined) =>
      toHarvardCv({
        ...EMPTY,
        experience: [{ company: "A", title: "B", startDate: "2020-01", description }],
      }).sections[0]?.entries[0]?.bullets;

    expect(section(plain, "experience").entries.map((e) => e.bullets)).toEqual([
      ["Diseñé APIs REST en Node.js.", "Reduje la latencia un 30%."],
      ["Interfaces en React", "Pruebas con Vitest", "Revisión de código"],
      ["Sitios para pymes."],
    ]);
    expect(
      bullets(
        "Lideré un equipo de aprox. 20 personas. Migré el portal a Next.js 15.  ¿El resultado? Menos errores.",
      ),
    ).toEqual([
      "Lideré un equipo de aprox. 20 personas.",
      "Migré el portal a Next.js 15.",
      "¿El resultado?",
      "Menos errores.",
    ]);
    expect(bullets("Primera frase. Segunda frase.\r\nTercera línea")).toEqual([
      "Primera frase. Segunda frase.",
      "Tercera línea",
    ]);
    expect(bullets("• Uno\n* Dos\n   \n-5% de errores")).toEqual(["Uno", "Dos", "-5% de errores"]);
    expect(bullets(undefined)).toEqual([]);
    expect(bullets(" \n ")).toEqual([]);
    expect(
      bullets("Lideré la migración del portal de pagos a microservicios sin punto final"),
    ).toEqual(["Lideré la migración del portal de pagos a microservicios sin punto final"]);
  });

  it("drops a mark left alone on its line and the marks Word and PDFs paste", () => {
    const cv = toHarvardCv({
      ...EMPTY,
      experience: [
        {
          company: "A",
          title: "B",
          startDate: "2020-01",
          description: "•\nDiseñé APIs\n– Guion de Word\n·   Viñeta de Symbol\n▪ Cuadro\n- Uno\n-",
        },
      ],
    });
    expect(section(cv, "experience").entries[0]?.bullets).toEqual([
      "Diseñé APIs",
      "Guion de Word",
      "Viñeta de Symbol",
      "Cuadro",
      "Uno",
    ]);
  });

  it("does not end a sentence at a title or an initial", () => {
    const bullets = (description: string) =>
      section(
        toHarvardCv({
          ...EMPTY,
          experience: [{ company: "A", title: "B", startDate: "2020-01", description }],
        }),
        "experience",
      ).entries[0]?.bullets;

    expect(
      bullets("Asesoré al Dr. García y a la Ing. Pérez. Viví en EE. UU. Reporté a Juan P. Gómez."),
    ).toEqual([
      "Asesoré al Dr. García y a la Ing. Pérez.",
      "Viví en EE. UU.",
      "Reporté a Juan P. Gómez.",
    ]);
    expect(bullets("Lideré el área de TI. Trabajé en Rappi S.A.S. Migré todo a la nube.")).toEqual([
      "Lideré el área de TI.",
      "Trabajé en Rappi S.A.S.",
      "Migré todo a la nube.",
    ]);
  });

  it("single-spaces and composes the text, so text that reads the same compares the same", () => {
    const decomposed = (text: string) => text.normalize("NFD");
    const messy = toHarvardCv({
      ...PROFILE,
      fullName: decomposed("Laura  Restrepo"),
      city: decomposed(" Medellín "),
      skills: [{ name: "TypeScript " }, { name: "React" }, { name: "Node.js" }, { name: "SQL" }],
      experience: PROFILE.experience.map((e) => ({
        ...e,
        company: decomposed(e.company),
        description: decomposed(e.description ?? "").replace(/ /g, "  \t"),
      })),
      education: PROFILE.education.map((e) => ({ ...e, degree: decomposed(e.degree) })),
    });

    expect(messy).toEqual(plain);
    expect(diffCv(plain, messy).changes).toBe(0);
  });

  it("leaves out every section with nothing to show", () => {
    const bare = toHarvardCv({ ...PROFILE, city: " ", education: [], skills: [] });
    expect(bare.contact).toEqual(["laura@example.com"]);
    expect(bare.sections.map((s) => s.key)).toEqual(["experience"]);
    expect(toHarvardCv(EMPTY).sections).toEqual([]);
    const blank = toHarvardCv(PROFILE, { ...TAILORED, headline: " ", summary: "" });
    expect(blank.sections.map((s) => s.key)).toEqual(["education", "experience", "skills"]);
  });

  it("keys an entry by its facts, the same in the plain and the tailored CV", () => {
    const keys = (cv: CvDocument) => section(cv, "experience").entries.map((e) => e.key);
    expect(keys(plain)).toEqual([
      "exp:rappi|softwareengineer|2023-02",
      "exp:globant|frontenddeveloper|2021-02",
      "exp:freelance|desarrolladoraweb|2019-03",
    ]);
    expect(keys(tailored)).toEqual([
      "exp:globant|frontenddeveloper|2021-02",
      "exp:rappi|softwareengineer|2023-02",
    ]);
    expect(section(plain, "education").entries[2]?.key).toBe(
      "edu:universidadeafit|ingenieríadesistemas",
    );
  });

  it("gives a repeated entry its own key, the same in the plain and the tailored CV", () => {
    const rappi = { company: "Rappi", title: "Dev", startDate: "2020-01", description: "Uno." };
    const profile: Profile = {
      ...EMPTY,
      experience: [rappi, { ...rappi }],
      education: [
        { institution: "SENA", degree: "Curso", startYear: 2015, endYear: 2015 },
        { institution: "SENA", degree: "Curso", startYear: 2018, endYear: 2018 },
      ],
    };
    const keys = (cv: CvDocument, key: CvSectionKey) => section(cv, key).entries.map((e) => e.key);
    const twice = toHarvardCv(profile, {
      ...TAILORED,
      experience: [rappi, rappi, rappi],
      skills: [],
    });
    const once = toHarvardCv(profile, { ...TAILORED, experience: [rappi], skills: [] });

    expect(keys(toHarvardCv(profile), "experience")).toEqual([
      "exp:rappi|dev|2020-01",
      "exp:rappi|dev|2020-01#2",
    ]);
    // A third mention has no third position to show.
    expect(keys(twice, "experience")).toEqual(["exp:rappi|dev|2020-01", "exp:rappi|dev|2020-01#2"]);
    expect(keys(once, "experience")).toEqual(["exp:rappi|dev|2020-01"]);
    expect(keys(once, "education")).toEqual(["edu:sena|curso#2", "edu:sena|curso"]);
    expect(section(once, "education").entries.map((e) => e.dates)).toEqual(["2018", "2015"]);

    const rows = sectionDiff(diffCv(toHarvardCv(profile), once), "experience").entries;
    expect(rows.map((e) => [e.key, e.status])).toEqual([
      ["exp:rappi|dev|2020-01", "same"],
      ["exp:rappi|dev|2020-01#2", "removed"],
    ]);
  });

  it("takes order and wording from the tailored profile and every fact from the profile", () => {
    const cv = toHarvardCv(PROFILE, {
      ...TAILORED,
      experience: [
        ...TAILORED.experience,
        { company: "Google", title: "Staff Engineer", startDate: "2020-01", description: "Nada." },
      ],
      skills: ["react", "Go", "TypeScript", "React"],
    });
    expect(section(cv, "experience").entries).toEqual([
      expect.objectContaining({ title: "Globant", subtitle: "Frontend Developer" }),
      {
        key: "exp:rappi|softwareengineer|2023-02",
        title: "Rappi",
        place: "",
        subtitle: "Software Engineer",
        dates: "Febrero 2023 – Actualidad",
        bullets: ["Reduje la latencia un 30%.", "Diseñé APIs REST en Node.js."],
      },
    ]);
    expect(section(cv, "skills").lines).toEqual(["Técnicas: React, TypeScript"]);
  });
});

describe("diffWords", () => {
  const PAIRS: Array<[string, string]> = [
    ["Educacion superior", "Educación superior"],
    ["React, Node.js y SQL.", "React; Node.js, SQL y Go!"],
    ["", "Texto nuevo"],
    ["Texto viejo", ""],
    ["Diseñé interfaces en React", "Construí APIs REST con Node.js"],
    ["Lideré el equipo", "Lideré todo el equipo"],
    ["  espacios   raros ", "espacios raros"],
    ["línea uno\nlínea dos", "línea uno\n\nlínea dos y tres"],
    ["añadí ñandú", "añadí ñandú"],
    ["Diseñé APIs REST.", "Diseñé APIs REST"],
    ["a b a b a b", "b a b a b a"],
    ["Técnicas: React, SQL", "Técnicas: SQL, React"],
    [" ", ""],
    ["\n", " "],
  ];

  it("rebuilds both texts from every diff, with no empty or unmerged parts", () => {
    for (const [before, after] of PAIRS) {
      const parts = diffWords(before, after);
      expect(read(parts, "before")).toBe(before);
      expect(read(parts, "after")).toBe(after);
      expect(parts.filter((p) => p.text === "")).toEqual([]);
      expect(parts.filter((p, k) => p.kind === parts[k - 1]?.kind)).toEqual([]);
    }
  });

  it("returns one same part for identical text and nothing for two empty strings", () => {
    expect(diffWords("Lideré el equipo", "Lideré el equipo")).toEqual([
      { kind: "same", text: "Lideré el equipo" },
    ]);
    expect(diffWords("", "")).toEqual([]);
    expect(diffWords("", "Hola")).toEqual([{ kind: "added", text: "Hola" }]);
  });

  it("marks a single inserted word and nothing else", () => {
    expect(diffWords("Lideré el equipo", "Lideré todo el equipo")).toEqual([
      { kind: "same", text: "Lideré " },
      { kind: "added", text: "todo " },
      { kind: "same", text: "el equipo" },
    ]);
  });

  it("replaces only the word whose accent changed", () => {
    expect(diffWords("Educacion superior", "Educación superior")).toEqual([
      { kind: "removed", text: "Educacion" },
      { kind: "added", text: "Educación" },
      { kind: "same", text: " superior" },
    ]);
  });

  it("shows a total rewrite as one deletion and one insertion, not word by word", () => {
    expect(diffWords("Diseñé interfaces en React", "Construí APIs REST con Node.js")).toEqual([
      { kind: "removed", text: "Diseñé interfaces en React" },
      { kind: "added", text: "Construí APIs REST con Node.js" },
    ]);
  });

  it("stays exact and quick on a text of twenty thousand words", () => {
    const words = (salt: string) =>
      Array.from({ length: 20_000 }, (_, i) => `palabra${(i * 7919) % 1000}${salt}`);
    const list = words("");
    const long = list.join(" ");
    const inserted = [...list.slice(0, 10_000), "nueva", ...list.slice(10_000)].join(" ");
    const started = performance.now();

    expect(diffWords(long, inserted)).toEqual([
      { kind: "same", text: `${list.slice(0, 10_000).join(" ")} ` },
      { kind: "added", text: "nueva " },
      { kind: "same", text: list.slice(10_000).join(" ") },
    ]);
    expect(diffWords(long, words("x").join(" "))).toEqual([
      { kind: "removed", text: long },
      { kind: "added", text: words("x").join(" ") },
    ]);
    // Seconds and gigabytes before the shared ends were skipped and the table capped.
    expect(performance.now() - started).toBeLessThan(1000);
  });
});

describe("diffCv", () => {
  // Every position reordered, every bullet reworded, the skills reversed.
  const rewritten = toHarvardCv(PROFILE, {
    ...TAILORED,
    headline: "Otra cosa",
    summary: "Todo distinto.",
    experience: [...PROFILE.experience].reverse().map((e, i) => ({
      ...e,
      description: `Logro ${i} reescrito por completo.\nOtro logro ${i} nuevo.`,
    })),
    skills: PROFILE.skills.map((s) => s.name).reverse(),
  });

  it("finds nothing to report between identical CVs", () => {
    const diff = diffCv(tailored, tailored);
    expect(diff.changes).toBe(0);
    expect(diff.sections.map((s) => s.status)).toEqual(["same", "same", "same", "same"]);
    expect(
      diff.sections.flatMap((s) => s.entries).every((e) => e.status === "same" && e.moved === 0),
    ).toBe(true);
    expect(diff.name).toEqual([{ kind: "same", text: "Laura Restrepo" }]);
    expect(diff.contact).toEqual([{ kind: "same", text: "Medellín • laura@example.com" }]);
  });

  it("reports how far each reordered entry moved without calling it changed", () => {
    const experience = section(plain, "experience");
    const [rappi, globant, freelance] = experience.entries;
    const reordered: CvDocument = {
      ...plain,
      sections: plain.sections.map((s) =>
        s === experience ? { ...s, entries: [freelance!, rappi!, globant!] } : s,
      ),
    };
    const diff = diffCv(plain, reordered);
    expect(
      sectionDiff(diff, "experience").entries.map((e) => [e.title[0]?.text, e.status, e.moved]),
    ).toEqual([
      ["Freelance", "same", -2],
      ["Rappi", "same", 1],
      ["Globant", "same", 1],
    ]);
    expect(sectionDiff(diff, "experience").status).toBe("changed");
    expect(diff.changes).toBe(3);
  });

  it("marks a rephrased bullet as changed, with the words removed and added", () => {
    const [globant] = sectionDiff(diffCv(plain, tailored), "experience").entries;
    expect(globant?.status).toBe("changed");
    expect(globant?.title).toEqual([{ kind: "same", text: "Globant" }]);
    expect(globant?.bullets).toEqual([
      [{ kind: "same", text: "Interfaces en React" }],
      [{ kind: "same", text: "Pruebas con Vitest" }],
      [
        { kind: "same", text: "Revisión de " },
        { kind: "removed", text: "código" },
        { kind: "added", text: "pull requests" },
      ],
    ]);
  });

  it("keeps untouched bullets whole when another one moves or is inserted", () => {
    const [, rappi] = sectionDiff(diffCv(plain, tailored), "experience").entries;
    expect(rappi?.bullets).toEqual([
      [{ kind: "removed", text: "Diseñé APIs REST en Node.js." }],
      [{ kind: "same", text: "Reduje la latencia un 30%." }],
      [{ kind: "added", text: "Diseñé APIs REST en Node.js." }],
    ]);

    const [globant] = TAILORED.experience;
    const inserted = toHarvardCv(PROFILE, {
      ...TAILORED,
      experience: [
        {
          ...globant!,
          description:
            "Mentoría a practicantes\nInterfaces en React\nPruebas con Vitest\nRevisión de código",
        },
      ],
    });
    const entry = sectionDiff(diffCv(plain, inserted), "experience").entries.find(
      (e) => e.key === "exp:globant|frontenddeveloper|2021-02",
    );
    expect(entry?.bullets).toEqual([
      [{ kind: "added", text: "Mentoría a practicantes" }],
      [{ kind: "same", text: "Interfaces en React" }],
      [{ kind: "same", text: "Pruebas con Vitest" }],
      [{ kind: "same", text: "Revisión de código" }],
    ]);
  });

  it("shows the tailored profile section as added, and as removed the other way round", () => {
    expect(diffCv(plain, tailored).sections[0]).toEqual({
      key: "profile",
      title: "Perfil",
      status: "added",
      entries: [],
      lines: [
        [{ kind: "added", text: TAILORED.headline }],
        [{ kind: "added", text: TAILORED.summary }],
      ],
    });

    const back = diffCv(tailored, plain).sections;
    expect(back.map((s) => [s.key, s.status])).toEqual([
      ["profile", "removed"],
      ["education", "same"],
      ["experience", "changed"],
      ["skills", "changed"],
    ]);
    expect(back[0]?.lines.flat().every((p) => p.kind === "removed")).toBe(true);
  });

  it("pairs reworded bullets in order when every position is reordered and rewritten", () => {
    const experience = sectionDiff(diffCv(plain, rewritten), "experience").entries;
    expect(experience.map((e) => [e.title[0]?.text, e.status, e.moved])).toEqual([
      ["Globant", "changed", -1],
      ["Rappi", "changed", 1],
      ["Freelance", "changed", 0],
    ]);
    expect(experience[2]?.bullets).toEqual([
      [
        { kind: "removed", text: "Sitios para pymes." },
        { kind: "added", text: "Logro 2 reescrito por completo." },
      ],
      [{ kind: "added", text: "Otro logro 2 nuevo." }],
    ]);
  });

  it("pairs profile lines by what they say, so a missing headline does not shift the summary", () => {
    const diff = diffCv(tailored, toHarvardCv(PROFILE, { ...TAILORED, headline: "" }));
    expect(sectionDiff(diff, "profile")).toMatchObject({
      status: "changed",
      lines: [
        [{ kind: "removed", text: TAILORED.headline }],
        [{ kind: "same", text: TAILORED.summary }],
      ],
    });
    expect(diff.changes).toBe(1);
  });

  it("handles empty profiles on either side", () => {
    const empty = toHarvardCv(EMPTY);
    expect(diffCv(empty, empty)).toEqual({
      name: [{ kind: "same", text: "Ana Gómez" }],
      contact: [{ kind: "same", text: "ana@example.com" }],
      sections: [],
      changes: 0,
    });

    const grown = diffCv(empty, plain);
    expect(grown.sections.map((s) => s.status)).toEqual(["added", "added", "added"]);
    // Four studies, three positions and one skills line.
    expect(grown.changes).toBe(8);
    expect(diffCv(plain, empty).changes).toBe(8);
  });

  it("strikes out a skill the tailored CV leaves out", () => {
    const diff = diffCv(
      plain,
      toHarvardCv(PROFILE, { ...TAILORED, skills: ["TypeScript", "React", "SQL"] }),
    );
    expect(sectionDiff(diff, "skills")).toMatchObject({
      status: "changed",
      lines: [
        [
          { kind: "same", text: "Técnicas: TypeScript, React, " },
          { kind: "removed", text: "Node.js, " },
          { kind: "same", text: "SQL" },
        ],
      ],
    });
  });

  it("keeps a removed entry where it was: above the entry that followed it, or at the end", () => {
    const cv = (...keys: string[]): CvDocument => ({
      name: "Ana",
      contact: [],
      sections: [
        {
          key: "experience",
          title: "Experiencia",
          lines: [],
          entries: keys.map((key) => ({
            key,
            title: key,
            place: "",
            subtitle: "",
            dates: "",
            bullets: [],
          })),
        },
      ],
    });
    const rows = (before: CvDocument, after: CvDocument) =>
      diffCv(before, after).sections[0]?.entries.map((e) => `${e.key}:${e.status}:${e.moved}`);

    expect(rows(cv("a", "b", "c"), cv("c", "x"))).toEqual([
      "a:removed:0",
      "b:removed:0",
      "c:same:0",
      "x:added:0",
    ]);
    expect(rows(cv("a", "b", "c"), cv("c", "a"))).toEqual(["b:removed:0", "c:same:-1", "a:same:1"]);
    expect(rows(cv("a", "b"), cv("x", "a"))).toEqual(["x:added:0", "a:same:0", "b:removed:0"]);
  });

  it("counts one change per entry that differs or moved and per line that differs", () => {
    const diff = diffCv(plain, tailored);
    expect(sectionDiff(diff, "experience").entries.map((e) => [e.key, e.status, e.moved])).toEqual([
      ["exp:globant|frontenddeveloper|2021-02", "changed", -1],
      ["exp:rappi|softwareengineer|2023-02", "changed", 1],
      ["exp:freelance|desarrolladoraweb|2019-03", "removed", 0],
