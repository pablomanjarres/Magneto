import type {
  CvDiff,
  CvDocument,
  CvEntry,
  CvEntryDiff,
  CvSection,
  CvSectionDiff,
  DiffKind,
  DiffPart,
  DiffStatus,
  Education,
  Experience,
  Profile,
  TailoredProfile,
} from "@moonlight/types";

import { dedupeSkills, normalizeSkill } from "./index.js";

/*
 * The CV in the Harvard format (the Harvard Office of Career Services
 * template), and the diff between two versions of it. Each entry's key comes
 * from its facts, never its wording, so the plain CV and one tailored to a
 * vacancy line up entry by entry.
 */

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/**
 * Trimmed, single-spaced and composed. The page collapses spaces and draws "é"
 * the same either way it is encoded, so text that reads the same compares the same.
 */
const clean = (text = ""): string => text.normalize("NFC").replace(/\s+/g, " ").trim();

/** Cleaned, without the empty ones. */
const present = (values: Array<string | undefined>): string[] => values.map(clean).filter(Boolean);

/** "2023-02" reads "Febrero 2023" and "2023" stays "2023"; anything else is shown as written. */
function monthYear(date: string): string {
  const text = clean(date);
  const [, year, month] = /^(\d{4})(?:-(\d{1,2}))?$/.exec(text) ?? [];
  if (!year) return text;
  const name = MONTHS[Number(month) - 1];
  return name ? `${name} ${year}` : year;
}

/** "Febrero 2023 – Actualidad"; an empty side is dropped and a span of one month or year shows once. */
const range = (start: string, end: string): string =>
  [...new Set([start, end])].filter(Boolean).join(" – ");

function educationYears({ startYear, endYear }: Education): string {
  const start = startYear ? String(startYear) : "";
  return range(start, endYear ? String(endYear) : start && "Actualidad");
}

/**
 * A sentence ends at . ! ? or … followed by a space and a capital letter, so
 * "Node.js" and "aprox. 20" stay whole. A title or an initial ends none, so
 * neither do "Dr. García", "EE. UU." or "Juan P. Gómez".
 */
const SENTENCE_BREAK =
  /(?<=[.!?…])(?<!(?:^|[\s(])(?:\p{Lu}|Dra?|Sra?|Srta|Ing|Lic|Prof|EE)\.)\s+(?=[\p{Lu}¿¡])/u;

/** The mark a line starts with, typed or pasted from Word or a PDF; the CV draws its own. "-5%" keeps its sign. */
const MARK = /^[-*•·▪◦●–—](?:\s|$)/;

/** One bullet per line of the description, or per sentence when it is a single line. */
function toBullets(description = ""): string[] {
  const unmarked = (lines: string[]): string[] =>
    present(lines.map((line) => clean(line).replace(MARK, "")));
  const lines = unmarked(description.split("\n"));
  return lines.length === 1 ? unmarked(lines.flatMap((line) => line.split(SENTENCE_BREAK))) : lines;
}

/** A name as a key spells it: case, spaces and dots ignored, as for skills. */
const fold = (text: string): string => normalizeSkill(clean(text));

/** Company, title and start name a position; its description may be reworded freely. */
const experienceKey = (e: Experience): string =>
  `exp:${fold(e.company)}|${fold(e.title)}|${e.startDate}`;

const educationKey = (e: Education): string => `edu:${fold(e.institution)}|${fold(e.degree)}`;

/** Each item with its key. A repeat gets "#2", "#3"…, so no two entries in a section share one. */
function withKeys<T>(items: T[], keyOf: (item: T) => string): Array<[T, string]> {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const key = keyOf(item);
    const n = (seen.get(key) ?? 0) + 1;
    seen.set(key, n);
    return [item, n > 1 ? `${key}#${n}` : key];
  });
}

const experienceEntry = ([e, key]: [Experience, string], description?: string): CvEntry => ({
  key,
  title: clean(e.company),
  place: "",
  subtitle: clean(e.title),
  dates: range(monthYear(e.startDate), e.endDate ? monthYear(e.endDate) : "Actualidad"),
  bullets: toBullets(description),
});

const educationEntry = ([e, key]: [Education, string]): CvEntry => ({
  key,
  title: clean(e.institution),
  place: "",
  subtitle: clean(e.degree),
  dates: educationYears(e),
  bullets: [],
});

const ONGOING = Number.MAX_SAFE_INTEGER;

/** Ongoing studies first, then the latest end year, then the latest start year. */
const byLatestEducation = (a: Education, b: Education): number =>
  (b.endYear || ONGOING) - (a.endYear || ONGOING) || b.startYear - a.startYear;

/** Current positions first, then the latest start. */
const byLatestPosition = (a: Experience, b: Experience): number =>
  Number(!b.endDate) - Number(!a.endDate) || b.startDate.localeCompare(a.startDate);

/**
 * The candidate's CV in the Harvard format; with `tailored`, the version for one
 * vacancy. That version takes its order and wording from `tailored` and every
 * fact from the profile, so an entry or skill the profile lacks never shows, and
 * a position shows at most as many times as the profile lists it.
 */
export function toHarvardCv(profile: Profile, tailored?: TailoredProfile): CvDocument {
  const positions = withKeys(profile.experience, experienceKey);
  const shown = new Set<string>();
  const experience = tailored
    ? tailored.experience.flatMap((t) => {
        const own = positions.find(
          ([e, key]) => !shown.has(key) && experienceKey(e) === experienceKey(t),
        );
        if (!own) return [];
        shown.add(own[1]);
        return [experienceEntry(own, t.description)];
      })
    : positions
        .sort(([a], [b]) => byLatestPosition(a, b))
        .map((own) => experienceEntry(own, own[0].description));

  const skills = dedupeSkills(
    (tailored
      ? tailored.skills.flatMap(
          (name) =>
            profile.skills.find((s) => normalizeSkill(s.name) === normalizeSkill(name))?.name ?? [],
        )
      : profile.skills.map((s) => s.name)
    ).map(clean),
  );

  const sections: CvSection[] = [
    {
      key: "profile",
      title: "Perfil",
      entries: [],
      lines: tailored ? present([tailored.headline, tailored.summary]) : [],
    },
    {
      key: "education",
      title: "Educación",
      entries: withKeys(profile.education, educationKey)
        .sort(([a], [b]) => byLatestEducation(a, b))
        .map(educationEntry),
      lines: [],
