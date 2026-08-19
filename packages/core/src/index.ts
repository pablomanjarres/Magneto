import type {
  Application,
  ApplicationCard,
  ApplicationStatus,
  CompletenessResult,
  MarketGap,
  Profile,
  Requirement,
  RequirementKind,
  ScoreLine,
  ScoreResult,
  Vacancy,
} from "@moonlight/types";

/**
 * One spelling rule for skills. Separators carry no meaning here, so "Node.js",
 * "node js" and "NodeJS" all collapse to the same key.
 */
export function normalizeSkill(raw: string): string {
  return raw.toLowerCase().replace(/[\s._-]/g, "");
}

/**
 * A missing must-have costs three times what a missing nice-to-have costs.
 * The candidate is shown these numbers, so they stay small and explainable.
 */
export const WEIGHTS: Record<RequirementKind, number> = {
  "must-have": 3,
  "nice-to-have": 1,
};

const heldSkills = (profile: Profile): Set<string> =>
  new Set(profile.skills.map((s) => normalizeSkill(s.name)));

/**
 * Score one profile against one vacancy, 0 to 100.
 * Pure: same inputs always give the same result. No IO, no clock, no randomness.
 */
export function scoreVacancy(profile: Profile, vacancy: Vacancy): ScoreResult {
  const held = heldSkills(profile);

  const breakdown: ScoreLine[] = vacancy.requirements.map((r) => ({
    skill: r.skill,
    kind: r.kind,
    met: held.has(normalizeSkill(r.skill)),
    weight: WEIGHTS[r.kind],
  }));

  const total = breakdown.reduce((sum, l) => sum + l.weight, 0);
  const earned = breakdown.reduce((sum, l) => sum + (l.met ? l.weight : 0), 0);
  const score = total === 0 ? 0 : Math.round((earned / total) * 100);

  const matched: Requirement[] = [];
  const missing: Requirement[] = [];
  for (const l of breakdown) {
    (l.met ? matched : missing).push({ skill: l.skill, kind: l.kind });
  }

  const musts = breakdown.filter((l) => l.kind === "must-have");
  const mustsMet = musts.filter((l) => l.met).length;
  const reason =
    musts.length === 0
      ? `Meets ${matched.length} of ${breakdown.length} requirements. None are mandatory.`
      : `Meets ${matched.length} of ${breakdown.length} requirements, including ${mustsMet} of ${musts.length} must-haves.`;

  return { vacancyId: vacancy.id, score, matched, missing, reason, breakdown };
}

/**
 * Rank every vacancy for a profile, best first.
 * Vacancies with no requirements carry no signal, so they are left out.
 * Ties break on must-haves met, then on vacancy id, so the order never wobbles.
 */
export function rankVacancies(profile: Profile, vacancies: Vacancy[]): ScoreResult[] {
  const mustsMet = (r: ScoreResult): number =>
    r.breakdown.filter((l) => l.kind === "must-have" && l.met).length;

  return vacancies
    .filter((v) => v.requirements.length > 0)
    .map((v) => scoreVacancy(profile, v))
    .sort(
      (a, b) =>
        b.score - a.score || mustsMet(b) - mustsMet(a) || a.vacancyId.localeCompare(b.vacancyId),
    );
}

/** Every field that counts toward 100%, with the label the candidate is shown. */
export const COMPLETENESS_FIELDS: ReadonlyArray<{
  label: string;
  filled: (p: Profile) => boolean;
}> = [
  { label: "Full name", filled: (p) => p.fullName.trim().length > 0 },
  { label: "City", filled: (p) => (p.city ?? "").trim().length > 0 },
  { label: "At least one skill", filled: (p) => p.skills.length > 0 },
  { label: "At least one position", filled: (p) => p.experience.length > 0 },
  { label: "Education", filled: (p) => p.education.length > 0 },
  { label: "Target role", filled: (p) => (p.expectations.targetRole ?? "").trim().length > 0 },
  {
    label: "Salary expectation",
    filled: (p) => p.expectations.salaryMin !== undefined && p.expectations.salaryMax !== undefined,
  },
  { label: "Work mode", filled: (p) => p.expectations.workModes.length > 0 },
  {
    label: "Relocation",
    filled: (p) => !p.expectations.willRelocate || p.expectations.cities.length > 0,
  },
];

/** What percentage of the profile is filled, and exactly what is not. */
export function profileCompleteness(profile: Profile): CompletenessResult {
  const missing = COMPLETENESS_FIELDS.filter((f) => !f.filled(profile)).map((f) => f.label);
  const filled = COMPLETENESS_FIELDS.length - missing.length;
  return {
    percentage: Math.round((filled / COMPLETENESS_FIELDS.length) * 100),
    missing,
  };
}

/**
 * Gaps measured against the whole vacancy set rather than a single offer.
 * This is the differentiator: completeness follows what the market asks for,
 * so the candidate closes the gap that unlocks the most vacancies first.
 */
export function marketGaps(profile: Profile, vacancies: Vacancy[]): MarketGap[] {
  if (vacancies.length === 0) return [];

  const held = heldSkills(profile);
  const demand = new Map<string, { label: string; count: number }>();

  for (const vacancy of vacancies) {
    for (const key of new Set(
      vacancy.requirements.map((r) => normalizeSkill(r.skill)).filter((k) => !held.has(k)),
    )) {
      const label = vacancy.requirements.find((r) => normalizeSkill(r.skill) === key)?.skill ?? key;
      const entry = demand.get(key);
      if (entry) entry.count += 1;
      else demand.set(key, { label, count: 1 });
    }
  }

  return [...demand.values()]
    .map((e) => ({
      skill: e.label,
      demandCount: e.count,
      sharePercent: Math.round((e.count / vacancies.length) * 100),
    }))
    .sort((a, b) => b.demandCount - a.demandCount || a.skill.localeCompare(b.skill));
}

/** The board's columns, left to right. Order is the pipeline. */
export const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "applied",
  "in-review",
  "interview",
  "rejected",
];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  "in-review": "In review",
  interview: "Interview",
  rejected: "Rejected",
};

/**
 * Every move the board allows, written out rather than derived. Four states do
 * not need an algorithm, and a table is the thing a reader can check.
 */
export const ALLOWED_MOVES: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  applied: ["in-review", "rejected"],
  "in-review": ["interview", "rejected"],
  interview: ["rejected"],
  rejected: ["applied"],
};

export function canMove(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return ALLOWED_MOVES[from].includes(to);
}

/** True when the string is one of the four statuses. Guards the API boundary. */
export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && APPLICATION_STATUSES.includes(value as ApplicationStatus);
}

/**
 * Join applications to the vacancies behind them and score each one, so the
 * board shows the same number the ranked list does. Pure: both the Next route
 * handlers and the Express service call this and get the same payload.
 * An application whose vacancy is gone is dropped rather than half-rendered.
 */
export function applicationCards(
  profile: Profile,
  applications: Application[],
  vacancies: Vacancy[],
): ApplicationCard[] {
  const byId = new Map(vacancies.map((v) => [v.id, v]));
  const column = (s: ApplicationStatus): number => APPLICATION_STATUSES.indexOf(s);

  return applications
    .flatMap((a) => {
      const vacancy = byId.get(a.vacancyId);
      return vacancy ? [{ ...a, vacancy, score: scoreVacancy(profile, vacancy).score }] : [];
    })
    .sort(
      (a, b) =>
        column(a.status) - column(b.status) || b.score - a.score || a.id.localeCompare(b.id),
    );
}

/** The same cards split into the board's four columns, in column order. */
export function groupByStatus(
  cards: ApplicationCard[],
): Array<{ status: ApplicationStatus; label: string; cards: ApplicationCard[] }> {
  return APPLICATION_STATUSES.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    cards: cards.filter((c) => c.status === status),
  }));
}

export { parseProfile } from "./parse-profile.js";
