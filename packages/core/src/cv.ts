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
    },
    { key: "experience", title: "Experiencia", entries: experience, lines: [] },
    {
      key: "skills",
      title: "Habilidades",
      entries: [],
      lines: skills.length > 0 ? [`Técnicas: ${skills.join(", ")}`] : [],
    },
  ];

  return {
    name: clean(profile.fullName),
    contact: present([profile.city, profile.email]),
    sections: sections.filter((s) => s.entries.length > 0 || s.lines.length > 0),
  };
}

/** Every text as a part of one kind. */
const all = (kind: DiffKind, texts: string[]): DiffPart[] => texts.map((text) => ({ kind, text }));

/** 16 MB of table. Past it, the changed middle shows as one removal and one insertion. */
const MAX_CELLS = 1 << 22;

/**
 * Each item kept, removed or added, walking a longest common subsequence of the
 * two lists. A tie removes first, so of two swapped bullets the first one moves.
 * The shared start and end need no table, so a small edit to a long text is cheap.
 */
function lcsEdits(before: string[], after: string[]): DiffPart[] {
  let head = 0;
  while (head < before.length && head < after.length && before[head] === after[head]) head++;
  let tail = 0;
  while (
    tail < Math.min(before.length, after.length) - head &&
    before[before.length - 1 - tail] === after[after.length - 1 - tail]
  ) {
    tail++;
  }
  const b = before.slice(head, before.length - tail);
  const a = after.slice(head, after.length - tail);
  const start = all("same", before.slice(0, head));
  const end = all("same", before.slice(before.length - tail));
  if ((b.length + 1) * (a.length + 1) > MAX_CELLS) {
    return [...start, ...all("removed", b), ...all("added", a), ...end];
  }

  const width = a.length + 1;
  // common[i * width + j]: the LCS length of b[i..] and a[j..].
  const common = new Uint32Array((b.length + 1) * width);
  const at = (i: number, j: number): number => common[i * width + j] ?? 0;
  for (let i = b.length - 1; i >= 0; i--) {
    for (let j = a.length - 1; j >= 0; j--) {
      common[i * width + j] =
        b[i] === a[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1));
    }
  }

  const edits = start;
  let i = 0;
  let j = 0;
  while (i < b.length || j < a.length) {
    const removed = b[i];
    const added = a[j];
    if (removed !== undefined && removed === added) {
      edits.push({ kind: "same", text: removed });
      i++;
      j++;
    } else if (removed !== undefined && (added === undefined || at(i + 1, j) >= at(i, j + 1))) {
      edits.push({ kind: "removed", text: removed });
      i++;
    } else if (added !== undefined) {
      edits.push({ kind: "added", text: added });
      j++;
    }
  }
  return edits.concat(end);
}

/**
 * Token edits merged into runs. Inside a run of changes the removed text goes
 * first, and a space between a removal and an addition belongs to both, so a
 * reworded phrase reads as one deletion and one insertion, not word by word.
 */
function toRuns(edits: DiffPart[]): DiffPart[] {
  const parts: DiffPart[] = [];
  const pending = { removed: "", added: "" };
  const flush = (): void => {
    for (const kind of ["removed", "added"] as const) {
      if (pending[kind]) parts.push({ kind, text: pending[kind] });
      pending[kind] = "";
    }
  };
  edits.forEach((edit, k) => {
    const around = new Set([edits[k - 1]?.kind, edits[k + 1]?.kind]);
    const glue = !edit.text.trim() && around.has("removed") && around.has("added");
    if (edit.kind === "same" && !glue) {
      flush();
      const last = parts.at(-1);
      if (last?.kind === "same") last.text += edit.text;
      else parts.push({ ...edit });
    } else {
      if (edit.kind !== "added") pending.removed += edit.text;
      if (edit.kind !== "removed") pending.added += edit.text;
    }
  });
  flush();
  return parts;
}

const tokens = (text: string): string[] => text.match(/\s+|\S+/g) ?? [];

/** A word-level diff: same + added rebuilds `after`, same + removed rebuilds `before`. */
export function diffWords(before: string, after: string): DiffPart[] {
  if (before === after) return before ? [{ kind: "same", text: before }] : [];
  return toRuns(lcsEdits(tokens(before), tokens(after)));
}

/** Lines matched by position and word-diffed; a line with no partner is fully added or removed. */
const byPosition = (before: string[], after: string[]): DiffPart[][] =>
  Array.from({ length: Math.max(before.length, after.length) }, (_, k) =>
    diffWords(before[k] ?? "", after[k] ?? ""),
  );

/**
 * Bullets or lines kept whole are matched first. Between two of them, the
 * removed and added ones pair up in order and are word-diffed; any left over is
 * fully removed or added.
 */
function diffLines(before: string[], after: string[]): DiffPart[][] {
  const lines: DiffPart[][] = [];
  const pending = { removed: [] as string[], added: [] as string[] };
  const flush = (): void => {
    lines.push(...byPosition(pending.removed, pending.added));
    pending.removed = [];
    pending.added = [];
  };
  for (const { kind, text } of lcsEdits(before, after)) {
    if (kind === "same") {
      flush();
      lines.push(diffWords(text, text));
    } else pending[kind].push(text);
  }
  flush();
  return lines;
}

/** One item in two versions; a side is undefined when the item only exists in the other. */
interface Pair<T> {
  /** The after version, or the before one when the item was removed. */
  item: T;
  before: T | undefined;
  after: T | undefined;
  /** Its position in before, -1 when it is new. */
  index: number;
}

/**
 * Pairs items by key, in the after order. An item only in before goes back
 * right above the item that followed it there, or at the end when it was last.
 */
function align<T extends { key: string }>(before: T[], after: T[]): Pair<T>[] {
  const taken = new Set<number>();
  const pairs = after.map((item): Pair<T> => {
    const index = before.findIndex((b, k) => !taken.has(k) && b.key === item.key);
    if (index >= 0) taken.add(index);
    return { item, before: before[index], after: item, index };
  });
  for (const [index, item] of [...before.entries()].reverse()) {
    if (taken.has(index)) continue;
    const next = pairs.findIndex((p) => p.index === index + 1);
    pairs.splice(next < 0 ? pairs.length : next, 0, {
      item,
      before: item,
      after: undefined,
      index,
    });
  }
  return pairs;
}

/** A diffed text that is not the same on both sides. */
export const differs = (parts: DiffPart[]): boolean => parts.some((p) => p.kind !== "same");
/** An entry that came, went, changed or moved: each one counts once in `changes`. */
export const touched = (e: CvEntryDiff): boolean => e.status !== "same" || e.moved !== 0;
const statusOf = (pair: Pair<unknown>, changed: boolean): DiffStatus =>
  !pair.before ? "added" : !pair.after ? "removed" : changed ? "changed" : "same";

/** Stands in for the missing side of an added or removed entry. */
const NO_ENTRY: CvEntry = { key: "", title: "", place: "", subtitle: "", dates: "", bullets: [] };

function diffEntries(before: CvEntry[], after: CvEntry[]): CvEntryDiff[] {
  const pairs = align(before, after);
  // The old positions of the entries both versions share, in their new order.
  const shared = pairs.filter((p) => p.before && p.after).map((p) => p.index);
  return pairs.map((pair) => {
    const b = pair.before ?? NO_ENTRY;
    const a = pair.after ?? NO_ENTRY;
    const title = diffWords(b.title, a.title);
    const place = diffWords(b.place, a.place);
    const subtitle = diffWords(b.subtitle, a.subtitle);
    const dates = diffWords(b.dates, a.dates);
    const bullets = diffLines(b.bullets, a.bullets);
    const changed = [title, place, subtitle, dates, ...bullets].some(differs);
    const moved =
      pair.before && pair.after
        ? shared.indexOf(pair.index) - shared.filter((i) => i < pair.index).length
        : 0;
    const status = statusOf(pair, changed);
    return { key: pair.item.key, status, moved, title, place, subtitle, dates, bullets };
  });
}

function diffSections(before: CvSection[], after: CvSection[]): CvSectionDiff[] {
  return align(before, after).map((pair) => {
    const lines = diffLines(pair.before?.lines ?? [], pair.after?.lines ?? []);
    const entries = diffEntries(pair.before?.entries ?? [], pair.after?.entries ?? []);
    const changed = lines.some(differs) || entries.some(touched);
    const { key, title } = pair.item;
    return { key, title, status: statusOf(pair, changed), lines, entries };
  });
}

/** Everything that changed between two CVs, entry by entry and word by word. */
export function diffCv(before: CvDocument, after: CvDocument): CvDiff {
  const sections = diffSections(before.sections, after.sections);
  // One change per entry that differs or moved and per line that differs; a
  // section added or removed with nothing inside counts once on its own.
  const changes = sections.reduce(
    (n, s) =>
      n +
      s.entries.filter(touched).length +
      s.lines.filter(differs).length +
      Number(s.status !== "same" && s.entries.length + s.lines.length === 0),
    0,
  );
  return {
    name: diffWords(before.name, after.name),
    contact: diffWords(before.contact.join(" • "), after.contact.join(" • ")),
    sections,
    changes,
  };
}
