import type { Profile, Vacancy } from "@moonlight/types";
import { getProfile, listApplications, listVacancies } from "@moonlight/db";
import { applicationCards, marketGaps, profileCompleteness, rankVacancies } from "@moonlight/core";

import { DEMO_PROFILE_ID } from "./demo";

/**
 * Everything the server components read, in one place. Pages stay a layout and
 * nothing else; the queries stay testable and are not copied per route.
 * The ADR settled on reading the database directly here rather than fetching
 * our own HTTP routes — see docs/adr/0001-backend-choice.md.
 */

export const loadProfile = (id: string = DEMO_PROFILE_ID): Promise<Profile | null> =>
  getProfile(id);

/** The dataset on its own, for a screen that scores in the browser as you type. */
export const loadVacancies = (): Promise<Vacancy[]> => listVacancies();

/** Counts for the side rail, on every page. */
export async function loadNavCounts(): Promise<{ vacancies: number; applications: number }> {
  const [vacancies, applications] = await Promise.all([
    listVacancies(),
    listApplications(DEMO_PROFILE_ID),
  ]);
  return { vacancies: vacancies.length, applications: applications.length };
}

/** The dashboard and the vacancy list read the same scored set. */
export async function loadRanked(profile: Profile) {
  const vacancies = await listVacancies();
  return {
    vacancies,
    completeness: profileCompleteness(profile),
    ranked: rankVacancies(profile, vacancies),
    gaps: marketGaps(profile, vacancies),
  };
}

export async function loadBoard(profile: Profile) {
  const [applications, vacancies] = await Promise.all([
    listApplications(profile.id),
    listVacancies(),
  ]);
  return applicationCards(profile, applications, vacancies);
}

/** Which vacancies the candidate already applied to, for the Apply button. */
export async function loadAppliedIds(profileId: string): Promise<Set<string>> {
  const applications = await listApplications(profileId);
  return new Set(applications.map((a) => a.vacancyId));
}
