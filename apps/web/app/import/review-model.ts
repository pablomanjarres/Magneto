import type { Education, Experience, ImportedProfile, Profile } from "@moonlight/types";
import { dedupeSkills, hasEducation, hasExperience, hasSkill } from "@moonlight/core";

/**
 * The review screen's state: every imported entry with whether the candidate
 * keeps it. Entries the profile already has start unselected and stay so,
 * since merging them would add nothing.
 */

export interface ReviewItem<T> {
  value: T;
  selected: boolean;
  exists: boolean;
}

export interface ReviewState {
  experience: ReviewItem<Experience>[];
  education: ReviewItem<Education>[];
  skills: ReviewItem<string>[];
}

const item = <T>(value: T, exists: boolean): ReviewItem<T> => ({
  value,
  exists,
  selected: !exists,
});

export function initialReview(profile: Profile, imported: ImportedProfile): ReviewState {
  return {
    experience: imported.experience.map((e) => item(e, hasExperience(profile, e))),
    education: imported.education.map((e) => item(e, hasEducation(profile, e))),
    skills: dedupeSkills(imported.skills.map((s) => s.name)).map((name) =>
      item(name, hasSkill(profile, name)),
    ),
  };
}

const kept = <T>(items: ReviewItem<T>[]): T[] =>
  items.filter((i) => i.selected).map((i) => i.value);

/** What the candidate confirmed, in the shape `mergeImport` takes. */
export function selection(imported: ImportedProfile, review: ReviewState): ImportedProfile {
  return {
    ...imported,
    experience: kept(review.experience),
    education: kept(review.education),
    skills: kept(review.skills).map((name) => ({ name, source: imported.source })),
  };
}

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Required fields an entry still lacks, named the way the form labels them. */
export function missingExperience(e: Experience): string[] {
  return [
    !e.company.trim() && "Empresa",
    !e.title.trim() && "Cargo",
    !YEAR_MONTH.test(e.startDate) && "Fecha de inicio",
  ].filter((label): label is string => Boolean(label));
}

export function missingEducation(e: Education): string[] {
  return [
    !e.institution.trim() && "Institución",
    !e.degree.trim() && "Título",
    !(e.startYear > 1900) && "Año de inicio",
  ].filter((label): label is string => Boolean(label));
}

export function isBlocked(review: ReviewState): boolean {
  return (
    review.experience.some((i) => i.selected && missingExperience(i.value).length > 0) ||
    review.education.some((i) => i.selected && missingEducation(i.value).length > 0)
  );
}

export const plural = (n: number, one: string, many: string): string => (n === 1 ? one : many);
