import type { Profile, Vacancy } from "@moonlight/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getProfile, listApplications, listVacancies } from "@moonlight/db";
import { applicationCards, marketGaps, profileCompleteness, rankVacancies } from "@moonlight/core";

/**
 * Everything the server components read, in one place. Pages stay a layout and
 * nothing else; the queries stay testable and are not copied per route.
 * The ADR settled on reading the database directly here rather than fetching
 * our own HTTP routes — see docs/adr/0001-backend-choice.md.
 */

/**
 * Which candidate the browser is working as. This is NOT authentication: there
 * is no password and no check, and anyone editing the cookie becomes somebody
 * else. Sign-in is HU_NF #32 and is not built. It exists only so the app knows
 * whose profile to show after the registration form.
 */
export const CANDIDATE_COOKIE = "moonlight_candidate";

export async function currentProfile(): Promise<Profile | null> {
  const id = (await cookies()).get(CANDIDATE_COOKIE)?.value;
  return id ? getProfile(id) : null;
}

/** The current candidate, or a trip to the registration form. */
export async function requireProfile(): Promise<Profile> {
  const profile = await currentProfile();
  if (!profile) redirect("/register");
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
