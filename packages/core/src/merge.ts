import type {
  Education,
  Experience,
  ImportedProfile,
  Profile,
  ProfileSource,
  Skill,
} from "@moonlight/types";

/**
 * Bringing an import into a profile. An import of someone else replaces the
 * profile; the same person's import completes it. Either way an entry is never
 * added twice: a job, a degree or a skill that is already there is joined with
 * its twin, keeping the best of both.
 */

export type ImportMode = "replace" | "complement";

export interface ImportCounts {
  experience: number;
  education: number;
  skills: number;
}

export interface ImportResult {
  profile: Profile;
  /** Entries that were not there before. */
  added: ImportCounts;
  /** Imported entries joined with one already in the profile. */
  joined: ImportCounts;
  /** Entries a replacement took out. */
  removed: ImportCounts;
}

const NONE: ImportCounts = { experience: 0, education: 0, skills: 0 };

/** Lower case, no accents, single spaces. */
const fold = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Words that never tell two names apart: articles and company forms. */
const FILLER = new Set([
  "de",
  "del",
  "la",
  "las",
  "el",
  "los",
  "y",
  "e",
  "en",
  "the",
  "of",
  "and",
  "at",
  "inc",
  "llc",
  "ltd",
  "ltda",
  "sas",
  "sa",
  "corp",
  "co",
]);

const words = (text: string): Set<string> =>
  new Set(
    fold(text)
      .split(/[^a-z0-9+#]+/)
      .filter((word) => word && !FILLER.has(word)),
  );

/** Every word of the shorter name is in the longer one: "EAFIT" and "Universidad EAFIT". */
function sameWords(a: string, b: string): boolean {
  const [x, y] = [words(a), words(b)];
  const [small, big] = x.size <= y.size ? [x, y] : [y, x];
  return small.size > 0 && [...small].every((word) => big.has(word));
}

/** Two names of one person: case, accents and middle names do not matter. */
export const samePerson = (a: string, b: string): boolean => sameWords(a, b);

/** Someone else's import replaces the profile; the same person's, or a nameless one, completes it. */
export function importMode(profile: Profile, imported: ImportedProfile): ImportMode {
  const name = imported.fullName?.trim() ?? "";
  if (!profile.fullName.trim() || !name) return "complement";
  return samePerson(profile.fullName, name) ? "complement" : "replace";
}

/** LinkedIn's generic qualifiers, which only repeat what a skill already is. */
const QUALIFIER =
  /\s*\((?:programming language|software|framework|library|lenguaje de programaci[oó]n|librer[ií]a)\)\s*$/i;

/** "Python (Programming Language)" reads "Python". */
export const cleanSkillName = (name: string): string =>
  name.replace(QUALIFIER, "").replace(/\s+/g, " ").trim();

/** Every spelling a skill answers to: "React.js" is "react"; "Model Context Protocol (MCP)" is also "mcp". */
function skillKeys(name: string): string[] {
  const key = (text: string): string => {
    const k = fold(text).replace(/[^a-z0-9+#]/g, "");
    return k.length > 2 && k.endsWith("js") ? k.slice(0, -2) : k;
  };
  const acronym = /^(.*\S)\s*\(([^)]+)\)$/.exec(name);
  return (acronym ? [key(acronym[1] ?? ""), key(acronym[2] ?? "")] : [key(name)]).filter(Boolean);
}

export const sameSkill = (a: string, b: string): boolean => {
  const keys = new Set(skillKeys(a));
  return skillKeys(b).some((k) => keys.has(k));
};

/** Every spelling of one skill collapses into the first one seen, without LinkedIn's qualifiers. */
export function dedupeSkills(names: readonly string[]): string[] {
  const kept: string[] = [];
  for (const raw of names) {
    const name = cleanSkillName(raw);
    if (name && !kept.some((held) => sameSkill(held, name))) kept.push(name);
  }
  return kept;
}

/** "2023-02" as a month count; undefined when there is no usable date. */
function months(date: string | undefined): number | undefined {
  const match = /^(\d{4})-(\d{2})$/.exec(date ?? "");
  return match ? Number(match[1]) * 12 + Number(match[2]) - 1 : undefined;
}

/** The same job: one company, overlapping dates, and a close start or the same title. */
export function sameJob(a: Experience, b: Experience): boolean {
  if (!sameWords(a.company, b.company)) return false;
  const [aStart, bStart] = [months(a.startDate), months(b.startDate)];
  if (aStart === undefined || bStart === undefined) return sameWords(a.title, b.title);
  const aEnd = months(a.endDate) ?? Number.MAX_SAFE_INTEGER;
  const bEnd = months(b.endDate) ?? Number.MAX_SAFE_INTEGER;
  const overlap = aStart <= bEnd && bStart <= aEnd;
  return overlap && (Math.abs(aStart - bStart) <= 3 || sameWords(a.title, b.title));
}

/** The years a study covers; a start of 0 is unknown, and no end means it is still going. */
function years(e: Education): [number, number] | undefined {
  const start = e.startYear || e.endYear;
  if (!start) return undefined;
  return [start, e.endYear ?? (e.startYear ? Number.MAX_SAFE_INTEGER : start)];
}

/**
 * The same studies: one institution, and the same degree, one side without a
 * degree, or overlapping years (one degree written in two languages).
 */
export function sameStudy(a: Education, b: Education): boolean {
  if (!sameWords(a.institution, b.institution)) return false;
  if (!a.degree.trim() || !b.degree.trim() || sameWords(a.degree, b.degree)) return true;
  const [x, y] = [years(a), years(b)];
  return x !== undefined && y !== undefined && x[0] <= y[1] && y[0] <= x[1];
}

/** What the candidate typed beats a résumé, and a résumé beats LinkedIn's prose. */
const rank = (source: ProfileSource | undefined): number =>
  source === "linkedin" ? 1 : source === "resume" ? 2 : 3;

/** The more specific of two names for one thing: "Founder and Software Engineer" over "Founder". */
const fuller = (best: string, other: string): string =>
  !best.trim() || (words(other).size > words(best).size && sameWords(best, other)) ? other : best;

/** Two records of one job become one: the better source leads, the other fills its gaps. */
function joinJob(a: Experience, b: Experience): Experience {
  const [best, other] = rank(b.source) > rank(a.source) ? [b, a] : [a, b];
  const dated = best.startDate ? best : other;
  return {
    company: fuller(best.company, other.company),
    title: fuller(best.title, other.title),
    startDate: dated.startDate,
    endDate: dated.endDate,
    description: best.description?.trim() ? best.description : other.description,
