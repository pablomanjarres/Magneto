import type {
  Education,
  Expectations,
  Experience,
  Profile,
  ProfileSource,
  WorkMode,
} from "@moonlight/types";

import { cleanSkillName, sameJob, sameSkill, sameStudy } from "./merge.js";
import { SENIORITIES, TARGET_AREAS, parseProfile } from "./parse-profile.js";

/** A job or degree to change, by its position in the list: only the fields given change, and null clears one. */
export type EntryChange<T> = { index: number } & {
  [K in Exclude<keyof T, "source">]?: T[K] | null | undefined;
};

/** Changes the candidate asked for in words, as the assistant passes them on. */
export interface ProfileEdits {
  fullName?: string | undefined;
  email?: string | undefined;
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
  // Jobs and degrees. Positions in update and remove are the ones before these edits.
  addExperience?: Experience[] | undefined;
  updateExperience?: EntryChange<Experience>[] | undefined;
  removeExperience?: number[] | undefined;
  addEducation?: Education[] | undefined;
  updateEducation?: EntryChange<Education>[] | undefined;
  removeEducation?: number[] | undefined;
}

/** How one kind of entry is recognised in the list and named in the changes. */
interface EntryKind<T> {
  noun: string;
  same: (a: T, b: T) => boolean;
  name: (entry: T) => string;
}

const JOB: EntryKind<Experience> = {
  noun: "Cargo",
  same: sameJob,
  name: (e) => `${e.title} en ${e.company}`,
};

const STUDY: EntryKind<Education> = {
  noun: "Estudio",
  same: sameStudy,
  name: (e) => `${e.degree}, ${e.institution}`,
};

/** The entry with the fields given in place of its own, null clearing one; undefined when nothing changes. */
function overlay<T extends object>(entry: T, fields: object): T | undefined {
  const given = Object.entries(fields).flatMap(([key, value]) =>
    value === undefined ? [] : [[key, value ?? undefined] as const],
  );
  const held = entry as Record<string, unknown>;
  if (given.every(([key, value]) => held[key] === value)) return undefined;
  return { ...entry, ...Object.fromEntries(given) };
}

/**
 * One list after the candidate's edits, with each entry that changed named
 * once. A position that is not in the list is ignored. An edit by position
 * keeps where the entry came from, as the wizard does. A dictated entry that is
 * already there updates it instead of adding a second one; either way it is the
 * candidate's own fact, so it carries no source.
 */
function editEntries<T extends { source?: ProfileSource | undefined }>(
  list: readonly T[],
  kind: EntryKind<T>,
  add: readonly T[] = [],
  update: readonly EntryChange<T>[] = [],
  remove: readonly number[] = [],
): { list: T[]; done: string[] } {
  const gone = new Set(remove);
  const slots: Array<{ entry: T; change?: "agregado" | "actualizado" }> = list.map((entry) => ({
    entry,
  }));

  for (const { index, ...fields } of update) {
    const slot = gone.has(index) ? undefined : slots[index];
    const next = slot && overlay(slot.entry, fields);
    if (slot && next) {
      slot.entry = next;
      slot.change = "actualizado";
    }
  }

  const kept = slots.filter((_, i) => !gone.has(i));
  for (const dictated of add) {
    const entry = { ...dictated, source: undefined };
    const twin = kept.find((slot) => kind.same(slot.entry, entry));
    if (!twin) {
      kept.push({ entry, change: "agregado" });
      continue;
    }
    const next = overlay(twin.entry, entry);
    if (next) {
      twin.entry = { ...next, source: undefined };
      twin.change ??= "actualizado";
    }
  }

  return {
    list: kept.map((slot) => slot.entry),
    done: [
      ...kept.flatMap(({ entry, change }) =>
        change ? [`${kind.noun} ${change}: ${kind.name(entry)}`] : [],
      ),
      ...list.filter((_, i) => gone.has(i)).map((e) => `${kind.noun} quitado: ${kind.name(e)}`),
    ],
  };
}

/** An address the profile accepts. parseProfile owns that rule, so it is asked rather than copied. */
export const isEmail = (email: string): boolean =>
  !("errors" in parseProfile({ id: "-", fullName: "-", email }));

/**
 * The profile with the requested edits applied, and each change in Spanish so
 * the answer can say exactly what happened. A skill already held under another
 * spelling is not added again, and a job or degree already listed is updated
 * rather than added twice. An area or seniority outside the app's lists, an
 * invalid e-mail and a position not in the list are left out rather than
 * reported as done. Pure; the caller saves the result.
 */
export function applyEdits(
  profile: Profile,
  edits: ProfileEdits,
): { profile: Profile; done: string[] } {
  const done: string[] = [];
  const has = (name: string): boolean => profile.skills.some((s) => sameSkill(s.name, name));

  const fullName = edits.fullName?.trim() || undefined;
  const typedEmail = edits.email?.trim();
  const email = typedEmail && isEmail(typedEmail) ? typedEmail : undefined;
  if (fullName) done.push(`Nombre: ${fullName}`);
  if (email) done.push(`Correo: ${email}`);

  const removed = (edits.removeSkills ?? []).filter(has);
  const added: string[] = [];
  for (const raw of edits.addSkills ?? []) {
    const name = cleanSkillName(raw);
    if (name && !has(name) && !added.some((held) => sameSkill(held, name))) added.push(name);
  }
  if (added.length > 0) done.push(`Habilidades agregadas: ${added.join(", ")}`);
  if (removed.length > 0) done.push(`Habilidades quitadas: ${removed.join(", ")}`);

  const experience = editEntries(
    profile.experience,
    JOB,
    edits.addExperience,
    edits.updateExperience,
    edits.removeExperience,
  );
  const education = editEntries(
    profile.education,
    STUDY,
    edits.addEducation,
    edits.updateEducation,
    edits.removeEducation,
  );
  done.push(...experience.done, ...education.done);

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
      fullName: fullName ?? profile.fullName,
      email: email ?? profile.email,
      city: edits.city ?? profile.city,
      skills: [
        ...profile.skills.filter((s) => !removed.some((name) => sameSkill(s.name, name))),
        ...added.map((name) => ({ name })),
      ],
      experience: experience.list,
      education: education.list,
      expectations,
    },
    done,
  };
}
