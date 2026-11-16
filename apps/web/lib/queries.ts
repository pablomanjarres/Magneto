import type { Profile, Vacancy } from "@moonlight/types";
import { getProfile, listApplications, listEvents, listVacancies } from "@moonlight/db";
import {
  applicationCards,
  describeEvent,
  marketGaps,
  profileCompleteness,
  rankVacancies,
} from "@moonlight/core";

/**
 * Everything the server components read, in one place. Pages stay a layout and
 * nothing else; the queries stay testable and are not copied per route.
 * Pages read the database directly here rather than fetching our own HTTP
 * routes, which is the whole reason the Next route handlers won the comparison.
 */

/**
 * The one candidate the app works as. There is no sign-in: login is outside
 * what Entrega 3 grades, so the app opens straight on the seeded profile.
 */
export const PROFILE_ID = "demo-candidate";

/** The candidate, or a clear stop when the database was never seeded. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile(PROFILE_ID);
  if (!profile) throw new Error(`Profile "${PROFILE_ID}" not found. Run pnpm db:seed.`);
  return profile;
}

/** The dataset on its own, for a screen that scores in the browser as you type. */
export const loadVacancies = (): Promise<Vacancy[]> => listVacancies();

/** Counts for the side rail. */
export async function loadNavCounts(
  profileId: string,
): Promise<{ vacancies: number; applications: number }> {
  const [vacancies, applications] = await Promise.all([
    listVacancies(),
    listApplications(profileId),
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

/** The last `limit` things the candidate did, already written as sentences. */
export async function loadActivity(profileId: string, limit = 10) {
  const [events, vacancies] = await Promise.all([listEvents(profileId, limit), listVacancies()]);
  const titles = new Map(vacancies.map((v) => [v.id, v.title]));
  return events.map((event) => ({
    id: event.id,
    createdAt: event.createdAt,
    sentence: describeEvent(event, titles.get(event.vacancyId) ?? "una vacante"),
  }));
}
