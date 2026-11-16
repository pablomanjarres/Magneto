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
