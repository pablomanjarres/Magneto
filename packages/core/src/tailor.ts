import type { Experience, Profile, TailoredProfile } from "@moonlight/types";

import { normalizeSkill } from "./index.js";

/** Company, title and dates identify an entry; the description may be reworded. */
const experienceKey = (e: Experience): string =>
  [normalizeSkill(e.company), normalizeSkill(e.title), e.startDate, e.endDate ?? ""].join("|");

const describe = (e: Experience): string => `${e.title} en ${e.company} (${e.startDate})`;

/**
 * The anti-fabrication check for a profile rewritten for one vacancy. Order and
 * wording may change; every entry and skill must already be in the profile, once.
 */
export function checkTailored(
  profile: Profile,
  tailored: TailoredProfile,
): { ok: boolean; problems: string[] } {
  const problems: string[] = [];

  const known = new Set(profile.experience.map(experienceKey));
  const seen = new Set<string>();
  for (const entry of tailored.experience) {
    const key = experienceKey(entry);
    if (!known.has(key)) {
      problems.push(`La experiencia "${describe(entry)}" no está en tu perfil.`);
    } else if (seen.has(key)) {
      problems.push(`La experiencia "${describe(entry)}" aparece repetida.`);
    }
    seen.add(key);
  }

  const held = new Set(profile.skills.map((s) => normalizeSkill(s.name)));
  for (const skill of tailored.skills) {
    if (!held.has(normalizeSkill(skill))) {
      problems.push(`La habilidad "${skill}" no está en tu perfil.`);
    }
  }

  return { ok: problems.length === 0, problems };
}

/**
 * The profile once the candidate accepts a tailored version: its wording, its
 * order and what it left out become the profile's own, and a headline or
 * summary it carries is kept. Jobs and skills are matched by the same keys
 * checkTailored uses, so only entries the profile already has can come through.
 */
export function acceptTailored(profile: Profile, tailored: TailoredProfile): Profile {
  const jobs = new Map(profile.experience.map((e) => [experienceKey(e), e]));
  const experience = tailored.experience.flatMap((entry) => {
    const key = experienceKey(entry);
    const own = jobs.get(key);
    if (!own) return [];
    jobs.delete(key);
    return [
      { ...own, description: entry.description?.trim() ? entry.description : own.description },
    ];
  });

  const taken = new Set<string>();
  const skills = tailored.skills.flatMap((name) => {
    const own = profile.skills.find((s) => normalizeSkill(s.name) === normalizeSkill(name));
    if (!own || taken.has(own.name)) return [];
    taken.add(own.name);
    return [own];
  });

  return {
    ...profile,
    headline: tailored.headline.trim() || profile.headline,
    summary: tailored.summary.trim() || profile.summary,
    experience,
    skills,
  };
}
