import type { Education, Experience, ImportedProfile, Profile, Skill } from "@moonlight/types";

import { normalizeSkill } from "./index.js";

/**
 * Imports from LinkedIn and résumés: recognising a profile URL, turning the
 * scraper's record into our shapes, and merging what the candidate confirmed
 * into their profile without duplicating anything already there.
 */

const PROFILE_URL =
  /^https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([A-Za-z0-9][A-Za-z0-9_-]{1,99})\/?(?:[?#].*)?$/;

/** The handle in a canonical profile URL, or null when it is not one. */
export function linkedInHandle(url: string): string | null {
  return PROFILE_URL.exec(url.trim())?.[1] ?? null;
}

export const isLinkedInProfileUrl = (url: string): boolean => linkedInHandle(url) !== null;

/** The one spelling the scraper accepts: https://www.linkedin.com/in/<handle>/ */
export function canonicalLinkedInUrl(url: string): string | null {
  const handle = linkedInHandle(url);
  return handle ? `https://www.linkedin.com/in/${handle}/` : null;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const MONTHS: Record<string, number> = {
  jan: 1,
  ene: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  abr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  ago: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
  dic: 12,
};

/**
 * Dates arrive as "2023-02", "Feb 2023", "2023" or { year, month }. All become
 * "YYYY-MM", the form the wizard uses; a bare year counts as January. Anything
 * unreadable is "", which the review screen asks the candidate to fill.
 */
export function toYearMonth(v: unknown): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  if (isRecord(v)) {
    const year = Number(v["year"]);
    const month = Number(v["month"] ?? 1);
    return Number.isInteger(year) && year > 1900
      ? `${year}-${pad(month >= 1 && month <= 12 ? month : 1)}`
      : "";
  }
  const s = str(v).toLowerCase();
  const iso = /(\d{4})-(\d{1,2})/.exec(s);
  if (iso) return `${iso[1]}-${pad(Number(iso[2]))}`;
  const year = /(\d{4})/.exec(s)?.[1];
  if (!year) return "";
  const month = Object.entries(MONTHS).find(([name]) => s.includes(name))?.[1] ?? 1;
  return `${year}-${pad(month)}`;
}

const yearOf = (v: unknown): number | undefined => {
  const ym = toYearMonth(v);
  return ym ? Number(ym.slice(0, 4)) : undefined;
};

/**
 * One record from the LinkedIn scraper (atomus/linkedin-profile-scraper) as an
 * import. A position with no end date is current, so `endDate` stays absent.
 */
export function mapLinkedInProfile(item: unknown): ImportedProfile {
  const root = isRecord(item) ? item : {};
  const p = isRecord(root["profile"]) ? root["profile"] : root;
  const location = isRecord(p["location"]) ? p["location"] : {};

  const experience: Experience[] = list(p["position_groups"]).flatMap((g) => {
    const group = isRecord(g) ? g : {};
    const groupCompany = isRecord(group["company"]) ? str(group["company"]["name"]) : "";
    return list(group["profile_positions"]).flatMap((raw) => {
      const pos = isRecord(raw) ? raw : {};
      const date = isRecord(pos["date"]) ? pos["date"] : {};
      const company = str(pos["company"]) || groupCompany;
      const title = str(pos["title"]);
      if (!company || !title) return [];
      const end = toYearMonth(date["end"]);
      return [
        {
          company,
          title,
          startDate: toYearMonth(date["start"]),
          endDate: end || undefined,
          description: str(pos["description"]) || undefined,
          source: "linkedin" as const,
        },
      ];
    });
  });

  const education: Education[] = list(p["educations"]).flatMap((raw) => {
    const e = isRecord(raw) ? raw : {};
    const school = isRecord(e["school"]) ? str(e["school"]["name"]) : str(e["school"]);
    const degree = [str(e["degree_name"]), str(e["field_of_study"])].filter(Boolean).join(", ");
    const date = isRecord(e["date"]) ? e["date"] : {};
    const startYear = yearOf(date["start"]);
    // A school with no degree still comes in; the review screen asks for the missing field.
    if (!school) return [];
    return [
      {
        institution: school,
        degree,
        startYear: startYear ?? 0,
        endYear: yearOf(date["end"]),
        source: "linkedin" as const,
      },
    ];
  });

  const skills: Skill[] = dedupeSkills(
    list(p["skills"]).map((s) => (isRecord(s) ? str(s["name"]) : str(s))),
  ).map((name) => ({ name, source: "linkedin" as const }));

  return {
    source: "linkedin",
    fullName:
      str(p["full_name"]) ||
      [str(p["first_name"]), str(p["last_name"])].filter(Boolean).join(" ") ||
      undefined,
    city: str(location["city"]) || str(location["short"]) || undefined,
    headline: str(p["headline"]) || undefined,
    experience,
    education,
    skills,
  };
}

/** Two spellings of one skill collapse into the first one seen. */
export function dedupeSkills(names: readonly string[]): string[] {
  const seen = new Set<string>();
  return names.filter((name) => {
    const key = normalizeSkill(name);
    if (!name.trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const norm = (s: string): string => normalizeSkill(s);

export const hasSkill = (profile: Profile, name: string): boolean =>
  profile.skills.some((s) => norm(s.name) === norm(name));

export const hasExperience = (profile: Profile, e: Experience): boolean =>
  profile.experience.some(
    (x) => norm(x.company) === norm(e.company) && norm(x.title) === norm(e.title),
  );

export const hasEducation = (profile: Profile, e: Education): boolean =>
  profile.education.some(
    (x) => norm(x.institution) === norm(e.institution) && norm(x.degree) === norm(e.degree),
  );

/**
 * Adds the confirmed entries the profile does not have yet. A name or city is
 * only filled when the profile has none: an import never overwrites what the
 * candidate typed. Pure; the caller saves the result.
 */
export function mergeImport(
  profile: Profile,
  imported: ImportedProfile,
): { profile: Profile; added: { experience: number; education: number; skills: number } } {
  const experience = imported.experience.filter((e) => !hasExperience(profile, e));
  const education = imported.education.filter((e) => !hasEducation(profile, e));
  const skills = dedupeSkills(imported.skills.map((s) => s.name))
    .filter((name) => !hasSkill(profile, name))
    .map((name) => ({ name, source: imported.source }));

  return {
    profile: {
      ...profile,
      fullName: profile.fullName.trim() || imported.fullName || profile.fullName,
      city: profile.city?.trim() ? profile.city : (imported.city ?? profile.city),
      experience: [
        ...profile.experience,
        ...experience.map((e) => ({ ...e, source: imported.source })),
      ],
      education: [
        ...profile.education,
        ...education.map((e) => ({ ...e, source: imported.source })),
      ],
      skills: [...profile.skills, ...skills],
    },
    added: { experience: experience.length, education: education.length, skills: skills.length },
  };
}
