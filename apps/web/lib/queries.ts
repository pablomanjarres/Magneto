import type { Profile, Vacancy } from "@moonlight/types";
import { getProfile, listApplications, listVacancies } from "@moonlight/db";
import { applicationCards, marketGaps, profileCompleteness, rankVacancies } from "@moonlight/core";

import { redirect } from "next/navigation";

import { currentProfile } from "./session";

/**
 * Everything the server components read, in one place. Pages stay a layout and
 * nothing else; the queries stay testable and are not copied per route.
 * The ADR settled on reading the database directly here rather than fetching
 * our own HTTP routes — see docs/adr/0001-backend-choice.md.
 */

/**
 * The signed-in candidate. Every screen reads their own data and nobody else's,
 * which is what the session cookie is for. Pass an id only to look one up
 * deliberately, never to decide who is looking at the page.
 */
export const loadProfile = (id?: string): Promise<Profile | null> =>
  id === undefined ? currentProfile() : getProfile(id);

/** The dataset on its own, for a screen that scores in the browser as you type. */
export const loadVacancies = (): Promise<Vacancy[]> => listVacancies();

/** Counts for the side rail, for whoever is signed in. */
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

/**
 * The signed-in candidate, or a trip to the sign-in page. Every screen behind
 * the rail starts with this, so "who is this?" is answered once per request and
 * never with a guess.
 */
export async function requireProfile(): Promise<Profile> {
  const profile = await currentProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Which vacancies the candidate already applied to, for the Apply button. */
export async function loadAppliedIds(profileId: string): Promise<Set<string>> {
  const applications = await listApplications(profileId);
  return new Set(applications.map((a) => a.vacancyId));
}
