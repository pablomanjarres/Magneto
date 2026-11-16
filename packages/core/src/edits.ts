import type { Expectations, Profile, WorkMode } from "@moonlight/types";

import { cleanSkillName, sameSkill } from "./merge.js";
import { SENIORITIES, TARGET_AREAS } from "./parse-profile.js";

/** Changes the candidate asked for in words, as the assistant passes them on. */
export interface ProfileEdits {
  addSkills?: string[] | undefined;
  removeSkills?: string[] | undefined;
  city?: string | undefined;
  targetRole?: string | undefined;
  targetArea?: string | undefined;
  targetSeniority?: string | undefined;
  salaryMin?: number | undefined;
  salaryMax?: number | undefined;
  currency?: string | undefined;
  workModes?: WorkMode[] | undefined;
  willRelocate?: boolean | undefined;
  relocationCities?: string[] | undefined;
}

/**
 * The profile with the requested edits applied, and each change in Spanish so
 * the answer can say exactly what happened. A skill already held under another
 * spelling is not added again, and an area or seniority outside the app's lists
 * is left out rather than reported as done. Pure; the caller saves the result.
 */
export function applyEdits(
  profile: Profile,
  edits: ProfileEdits,
): { profile: Profile; done: string[] } {
  const done: string[] = [];
  const has = (name: string): boolean => profile.skills.some((s) => sameSkill(s.name, name));

  const removed = (edits.removeSkills ?? []).filter(has);
  const added: string[] = [];
  for (const raw of edits.addSkills ?? []) {
    const name = cleanSkillName(raw);
    if (name && !has(name) && !added.some((held) => sameSkill(held, name))) added.push(name);
  }
  if (added.length > 0) done.push(`Habilidades agregadas: ${added.join(", ")}`);
  if (removed.length > 0) done.push(`Habilidades quitadas: ${removed.join(", ")}`);

  const expectations: Expectations = { ...profile.expectations };
  const set = <K extends keyof Expectations>(
    key: K,
    value: Expectations[K] | undefined,
    label: string,
  ): void => {
    if (value === undefined) return;
    expectations[key] = value;
    done.push(`${label}: ${Array.isArray(value) ? value.join(", ") : String(value)}`);
  };
  const listed = (value: string | undefined, allowed: readonly string[]): string | undefined =>
    value !== undefined && allowed.includes(value) ? value : undefined;

  set("targetRole", edits.targetRole, "Cargo objetivo");
  set("targetArea", listed(edits.targetArea, TARGET_AREAS), "Área");
  set("targetSeniority", listed(edits.targetSeniority, SENIORITIES), "Seniority");
  set("salaryMin", edits.salaryMin, "Salario mínimo");
  set("salaryMax", edits.salaryMax, "Salario máximo");
  set("currency", edits.currency, "Moneda");
  set("workModes", edits.workModes, "Modalidades");
  set("willRelocate", edits.willRelocate, "Dispuesto a reubicarse");
  set("cities", edits.relocationCities, "Ciudades a las que se mudaría");
  if (edits.city) done.push(`Ciudad: ${edits.city}`);

  return {
    profile: {
      ...profile,
      city: edits.city ?? profile.city,
      skills: [
        ...profile.skills.filter((s) => !removed.some((name) => sameSkill(s.name, name))),
        ...added.map((name) => ({ name })),
      ],
      expectations,
    },
    done,
  };
}
