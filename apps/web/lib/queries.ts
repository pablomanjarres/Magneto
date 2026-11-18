import { cookies } from "next/headers";
import type { Application, Profile, Vacancy } from "@moonlight/types";
import {
  getProfile,
  listApplications,
  listEvents,
  listProfiles,
  listVacancies,
  type ProfileSummary,
} from "@moonlight/db";
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
 * The candidate the app opens as. There is no sign-in: login is outside what
 * Entrega 3 grades, so the app opens straight on the seeded profile, and the
 * header can switch it to another one.
 */
export const PROFILE_ID = "demo-candidate";

/** The profile picked in the header. Set by POST /api/session, read only here. */
export const PROFILE_COOKIE = "moonlight-profile";

/** The seeded test profiles (data/sample-profiles/test-*.json) share this id prefix. */
const TEST_PREFIX = "test-";

/** The seeded profiles the public demo opens on; they are never deleted. */
export const isSampleProfile = (id: string): boolean =>
  id === PROFILE_ID || id.startsWith(TEST_PREFIX);

/**
 * The candidate picked in the header, or the seeded one when nothing was
 * picked or the pick no longer exists; a clear stop when the database was
 * never seeded.
 */
export async function requireProfile(): Promise<Profile> {
  const picked = (await cookies()).get(PROFILE_COOKIE)?.value;
  const profile = (picked ? await getProfile(picked) : null) ?? (await getProfile(PROFILE_ID));
  if (!profile) throw new Error(`Profile "${PROFILE_ID}" not found. Run pnpm db:seed.`);
  return profile;
}

/** A profile as the header's switcher lists it. */
export type ProfileChoice = ProfileSummary & { test: boolean };

/** Every profile the header can switch to, with the seeded test ones marked. */
export async function loadProfileChoices(): Promise<ProfileChoice[]> {
  const profiles = await listProfiles();
  return profiles.map((p) => ({ ...p, test: p.id.startsWith(TEST_PREFIX) }));
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

/** The candidate's applications by vacancy: which rows to mark, and what each Apply button shows. */
export async function loadApplied(profileId: string): Promise<Map<string, Application>> {
  const applications = await listApplications(profileId);
  return new Map(applications.map((a) => [a.vacancyId, a]));
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
