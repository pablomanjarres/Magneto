import type { Education, Experience, ImportedProfile } from "@moonlight/types";
import { dedupeSkills } from "@moonlight/core";

/** The review screen's state: every imported entry and whether the candidate keeps it. */

export interface ReviewItem<T> {
  value: T;
  selected: boolean;
}

export interface ReviewState {
  experience: ReviewItem<Experience>[];
  education: ReviewItem<Education>[];
  skills: ReviewItem<string>[];
}

const kept = <T>(value: T): ReviewItem<T> => ({ value, selected: true });

export function initialReview(imported: ImportedProfile): ReviewState {
  return {
    experience: imported.experience.map((e) => kept(e)),
    education: imported.education.map((e) => kept(e)),
    skills: dedupeSkills(imported.skills.map((s) => s.name)).map((name) => kept(name)),
  };
}

const chosen = <T>(items: ReviewItem<T>[]): T[] =>
  items.filter((i) => i.selected).map((i) => i.value);

/** What the candidate confirmed, in the shape `applyImport` takes. */
export function selection(imported: ImportedProfile, review: ReviewState): ImportedProfile {
  return {
    ...imported,
    experience: chosen(review.experience),
    education: chosen(review.education),
    skills: chosen(review.skills).map((name) => ({ name, source: imported.source })),
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
    !(e.startYear > 1900) && !e.endYear && "Año de inicio o de fin",
  ].filter((label): label is string => Boolean(label));
}

export function isBlocked(review: ReviewState): boolean {
  return (
    review.experience.some((i) => i.selected && missingExperience(i.value).length > 0) ||
    review.education.some((i) => i.selected && missingEducation(i.value).length > 0)
  );
}

export const plural = (n: number, one: string, many: string): string => (n === 1 ? one : many);
