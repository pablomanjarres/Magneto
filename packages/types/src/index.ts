/** Shapes shared across every boundary. No logic lives here. */

export type WorkMode = "remote" | "hybrid" | "onsite";
export type RequirementKind = "must-have" | "nice-to-have";

/** Where an entry came from. Absent means the candidate typed it. */
export type ProfileSource = "linkedin" | "resume";

export interface Skill {
  name: string;
  source?: ProfileSource | undefined;
}

export interface Experience {
  company: string;
  title: string;
  startDate: string;
  endDate?: string | undefined;
  description?: string | undefined;
  source?: ProfileSource | undefined;
}

export interface Education {
  institution: string;
  degree: string;
  startYear: number;
  endYear?: number | undefined;
  source?: ProfileSource | undefined;
}

export interface Expectations {
  targetRole?: string | undefined;
  targetArea?: string | undefined;
  targetSeniority?: string | undefined;
  salaryMin?: number | undefined;
  salaryMax?: number | undefined;
  currency?: string | undefined;
  workModes: WorkMode[];
  /** Undefined means the candidate has not answered yet. */
  willRelocate?: boolean | undefined;
  cities: string[];
}

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  city?: string | undefined;
  /** The résumé's opening line and short summary, once the candidate accepts them. */
  headline?: string | undefined;
  summary?: string | undefined;
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  expectations: Expectations;
}

/** A single thing a vacancy asks for. Weight is derived from the kind, never stored twice. */
export interface Requirement {
  skill: string;
  kind: RequirementKind;
}

export interface Vacancy {
  id: string;
  title: string;
  company: string;
  city: string;
  workMode: WorkMode;
  salaryMin?: number | undefined;
  salaryMax?: number | undefined;
  currency?: string | undefined;
  requirements: Requirement[];
}

export interface ScoreLine {
  skill: string;
  kind: RequirementKind;
  met: boolean;
  weight: number;
}

export interface ScoreResult {
  vacancyId: string;
  score: number;
  matched: Requirement[];
  missing: Requirement[];
  reason: string;
  breakdown: ScoreLine[];
  /** Present only when the vacancy lost points for being outside the candidate's city. */
  location?: { city: string; points: number } | undefined;
}

/** Where an application sits in the candidate's own pipeline. */
export type ApplicationStatus = "applied" | "in-review" | "interview" | "rejected";

/**
 * A candidate's application to one vacancy. The brief rules out real
 * auto-applying, so this records an application the candidate makes and tracks
 * its state; nothing is sent anywhere.
 */
export interface Application {
  id: string;
  profileId: string;
  vacancyId: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  note?: string | undefined;
}

/** An application with the vacancy behind it and its score, for the board. */
export interface ApplicationCard extends Application {
  vacancy: Vacancy;
  score: number;
}

export interface CompletenessResult {
  percentage: number;
  missing: string[];
}

/** A skill the candidate lacks, measured against the whole vacancy set. */
export interface MarketGap {
  skill: string;
  demandCount: number;
  sharePercent: number;
}

/** What a candidate did on the board. One row each, kept after a withdrawal. */
export type ApplicationEventKind = "applied" | "moved" | "note" | "withdrawn";

/** One line of the activity log. `detail` carries "from→to" for a move. */
export interface ApplicationEvent {
  id: string;
  profileId: string;
  vacancyId: string;
  applicationId: string;
  kind: ApplicationEventKind;
  detail?: string | undefined;
  createdAt: string;
}

/** What an import read from LinkedIn or a résumé, before the candidate confirms any of it. */
export interface ImportedProfile {
  source: ProfileSource;
  fullName?: string | undefined;
  email?: string | undefined;
  city?: string | undefined;
  headline?: string | undefined;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
}

/** One step of an import, streamed to the browser as it happens. */
export type ImportEvent =
  | { phase: "fetching" | "reading" | "mapping" }
  | { phase: "done"; imported: ImportedProfile }
  | { phase: "error"; message: string };

/**
 * The candidate's own profile rewritten for one vacancy: the same entries,
 * reordered and rephrased, never new ones.
 */
export interface TailoredProfile {
  /** The vacancy it was written for; absent when the candidate's own instructions shaped it. */
  vacancyId?: string;
  headline: string;
  summary: string;
  experience: Experience[];
  skills: string[];
}

/** One job or degree on a CV. `key` stays the same across versions, so a reworded or moved entry is still recognised. */
export interface CvEntry {
  key: string;
  /** Left, bold: the organisation or institution. */
  title: string;
  /** Right of the title: the city, empty when unknown. */
  place: string;
  /** Left, italic: the position or degree. */
  subtitle: string;
  /** Right of the subtitle: "Febrero 2023 – Actualidad". */
  dates: string;
  bullets: string[];
}

export type CvSectionKey = "profile" | "education" | "experience" | "skills";

export interface CvSection {
  key: CvSectionKey;
  title: string;
  entries: CvEntry[];
  /** Free lines: the profile summary, or "Técnicas: …" for skills. */
  lines: string[];
}

/** A CV laid out in the Harvard format: the header, then its sections in a fixed order. */
export interface CvDocument {
  name: string;
  contact: string[];
  sections: CvSection[];
}

export type DiffKind = "same" | "added" | "removed";

/** A run of text in a word diff. Same + added rebuilds the new text; same + removed the old one. */
export interface DiffPart {
  kind: DiffKind;
  text: string;
}

export type DiffStatus = "same" | "changed" | "added" | "removed";

export interface CvEntryDiff {
  key: string;
  status: DiffStatus;
  /** Positions moved within its section: negative went up, positive went down, 0 stayed. */
  moved: number;
  title: DiffPart[];
  place: DiffPart[];
  subtitle: DiffPart[];
  dates: DiffPart[];
  /** One word diff per bullet line. */
  bullets: DiffPart[][];
}

export interface CvSectionDiff {
  key: CvSectionKey;
  title: string;
  status: DiffStatus;
  lines: DiffPart[][];
  entries: CvEntryDiff[];
}

/** What changed between two versions of a CV, ready to draw both sides. */
export interface CvDiff {
  name: DiffPart[];
  contact: DiffPart[];
  sections: CvSectionDiff[];
  /** How many entries or lines differ, for a summary like "6 cambios". */
  changes: number;
}
