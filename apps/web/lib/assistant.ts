import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import {
  createApplication,
  getVacancy,
  listApplications,
  listVacancies,
  saveProfile,
} from "@moonlight/db";
import {
  SENIORITIES,
  cleanSkillName,
  normalizeCity,
  parseProfile,
  profileCompleteness,
  rankVacancies,
  sameSkill,
} from "@moonlight/core";
import type { Profile } from "@moonlight/types";

import { CLAUDE_MODEL, claude } from "./claude";
import type { AssistantAction, ChatMessage } from "./client";
import { UserFacingError } from "./errors";
import { publish } from "./events";
import { Draft, TailorError, tailorFromInstructions } from "./tailor";

/** Tool rounds one answer may take before Luna gives up rather than loop. */
const MAX_ROUNDS = 6;

const WORK_MODES = ["remote", "hybrid", "onsite"] as const;
const PAGE = /^\/(?:dashboard|jobs|applications|cv|profile|onboarding|import|jobs\/[\w-]+)$/;

/** One tool: what the model reads, the shape its input must have, and what it does. */
type Tool<S extends z.ZodType> = {
  description: string;
  input: S;
  run: (input: z.infer<S>, turn: Turn) => Promise<unknown>;
};

/** What one answer works on: the profile as it is now, the last adapted CV and the actions for the browser. */
type Turn = {
  profile: Profile;
  tailored: z.infer<typeof Draft> | undefined;
  actions: AssistantAction[];
};

const tool = <S extends z.ZodType>(t: Tool<S>): Tool<S> => t;

/** Merges the requested changes into the profile and lists them in Spanish; nothing is saved here. */
function applyChanges(
  profile: Profile,
  changes: z.infer<typeof ProfileChanges>,
): { next: Profile; done: string[] } {
  const done: string[] = [];
  // The same matching the imports use: "React.js" is "React", so it is never added twice.
  const has = (name: string): boolean => profile.skills.some((s) => sameSkill(s.name, name));

  const removed = (changes.removeSkills ?? []).filter(has);
  const added: string[] = [];
  for (const raw of changes.addSkills ?? []) {
    const name = cleanSkillName(raw);
    if (name && !has(name) && !added.some((held) => sameSkill(held, name))) added.push(name);
  }
  if (added.length > 0) done.push(`Habilidades agregadas: ${added.join(", ")}`);
  if (removed.length > 0) done.push(`Habilidades quitadas: ${removed.join(", ")}`);

  const expectations = { ...profile.expectations };
  const set = <K extends keyof typeof expectations>(
    key: K,
    value: (typeof expectations)[K] | undefined,
    label: string,
  ): void => {
    if (value === undefined) return;
    expectations[key] = value;
    done.push(`${label}: ${Array.isArray(value) ? value.join(", ") : String(value)}`);
  };
  set("targetRole", changes.targetRole, "Cargo objetivo");
  set("targetSeniority", changes.targetSeniority, "Seniority");
  set("salaryMin", changes.salaryMin, "Salario mínimo");
  set("salaryMax", changes.salaryMax, "Salario máximo");
  set("currency", changes.currency, "Moneda");
  set("workModes", changes.workModes, "Modalidades");
  set("willRelocate", changes.willRelocate, "Dispuesto a reubicarse");
  set("cities", changes.relocationCities, "Ciudades a las que se mudaría");
  if (changes.city) done.push(`Ciudad: ${changes.city}`);

  return {
    next: {
      ...profile,
      city: changes.city ?? profile.city,
      skills: [
        ...profile.skills.filter((s) => !removed.some((name) => sameSkill(s.name, name))),
        ...added.map((name) => ({ name })),
      ],
      expectations,
    },
    done,
  };
}

const ProfileChanges = z.object({
  addSkills: z.array(z.string()).optional(),
  removeSkills: z.array(z.string()).optional(),
  city: z.string().optional(),
  targetRole: z.string().optional(),
  targetSeniority: z.enum(SENIORITIES as [string, ...string[]]).optional(),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  currency: z.string().optional(),
  workModes: z.array(z.enum(WORK_MODES)).optional(),
  willRelocate: z.boolean().optional(),
  relocationCities: z.array(z.string()).optional(),
});

/** Lowercase and without accents, so "medellin" finds "Medellín". */
const fold = normalizeCity;

const TOOLS = {
  go_to: tool({
    description:
      "Lleva al candidato a una página de la app. Úsala cuando pida ir a algún lado o cuando ver la página le sirva. /jobs/<id> abre una vacante por su id.",
    input: z.object({
      path: z
        .string()
        .describe(
          "Una de: /dashboard, /jobs, /jobs/<id>, /applications, /cv, /profile, /onboarding, /import",
        ),
    }),
    run: async ({ path }, turn) => {
      if (!PAGE.test(path)) return { error: `"${path}" no es una página de la app.` };
      const id = path.match(/^\/jobs\/(.+)$/)?.[1];
      if (id && !(await getVacancy(id))) return { error: `No existe la vacante ${id}.` };
      turn.actions.push({ type: "navigate", path });
      return { ok: true, navegando_a: path };
    },
  }),

  tailor_cv: tool({
    description:
      "Adapta la hoja de vida según instrucciones (enfoque, longitud, tono, idioma, un tipo de cargo). Nunca agrega datos que no estén en el perfil. Si ya hay una versión adaptada, la refina. El candidato verá el resultado en /cv junto a la original.",
    input: z.object({
      instructions: z
        .string()
        .describe("Lo que el candidato pidió, completo y en sus palabras, con el contexto útil."),
    }),
    run: async ({ instructions }, turn) => {
      try {
        const { tailored, reply } = await tailorFromInstructions(
          turn.profile,
          instructions,
          turn.tailored,
        );
        turn.tailored = {
          ...tailored,
          experience: tailored.experience.map((e) => ({
            ...e,
            endDate: e.endDate ?? null,
            description: e.description ?? "",
          })),
        };
        turn.actions.push({ type: "tailored", tailored });
        return { ok: true, cambios: reply, titular: tailored.headline };
      } catch (cause) {
        if (cause instanceof TailorError) return { error: cause.message };
        throw cause;
      }
    },
  }),

  update_profile: tool({
    description:
      "Cambia el perfil guardado del candidato: agregar o quitar habilidades, ciudad, cargo objetivo, seniority, rango salarial y moneda, modalidades de trabajo y disponibilidad para reubicarse. Solo lo que el candidato pidió.",
    input: ProfileChanges,
    run: async (changes, turn) => {
      const { next, done } = applyChanges(turn.profile, changes);
      if (done.length === 0) return { ok: true, cambios: [], nota: "No había nada que cambiar." };
      const parsed = parseProfile(next);
      if ("errors" in parsed) return { error: parsed.errors.join(", ") };
      turn.profile = await saveProfile(parsed.profile);
      turn.actions.push({ type: "refresh" });
