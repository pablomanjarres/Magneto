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
  TARGET_AREAS,
  applyEdits,
  normalizeCity,
  parseProfile,
  profileCompleteness,
  rankVacancies,
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

const ProfileChanges = z.object({
  addSkills: z.array(z.string()).optional(),
  removeSkills: z.array(z.string()).optional(),
  city: z.string().optional(),
  targetRole: z.string().optional(),
  targetArea: z.enum(TARGET_AREAS as [string, ...string[]]).optional(),
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
      "Cambia el perfil guardado del candidato: agregar o quitar habilidades, ciudad, cargo objetivo, área, seniority, rango salarial y moneda, modalidades de trabajo, disponibilidad para reubicarse y ciudades a las que se mudaría. Solo lo que el candidato pidió.",
    input: ProfileChanges,
    run: async (changes, turn) => {
      const { profile: next, done } = applyEdits(turn.profile, changes);
      if (done.length === 0) return { ok: true, cambios: [], nota: "No había nada que cambiar." };
      const parsed = parseProfile(next);
      if ("errors" in parsed) return { error: parsed.errors.join(", ") };
      turn.profile = await saveProfile(parsed.profile);
      turn.actions.push({ type: "refresh" });
      return {
        ok: true,
        cambios: done,
        completitud: profileCompleteness(turn.profile).percentage,
      };
    },
  }),

  search_vacancies: tool({
    description:
      "Busca vacantes y las ordena por el puntaje de coincidencia con el perfil. Devuelve las 5 mejores.",
    input: z.object({
      query: z
        .string()
        .optional()
        .describe("Texto a buscar en el cargo, la empresa o los requisitos"),
      city: z.string().optional(),
      workMode: z.enum(WORK_MODES).optional(),
    }),
    run: async ({ query, city, workMode }, turn) => {
      const vacancies = (await listVacancies()).filter(
        (v) =>
          (!query ||
            fold([v.title, v.company, ...v.requirements.map((r) => r.skill)].join(" ")).includes(
              fold(query),
            )) &&
          (!city || fold(v.city) === fold(city)) &&
          (!workMode || v.workMode === workMode),
      );
      const byId = new Map(vacancies.map((v) => [v.id, v]));
      const top = rankVacancies(turn.profile, vacancies).slice(0, 5);
      return {
        total: vacancies.length,
        vacantes: top.map((r) => {
          const v = byId.get(r.vacancyId)!;
          return {
            id: v.id,
            title: v.title,
            company: v.company,
            city: v.city,
            workMode: v.workMode,
            score: r.score,
          };
        }),
      };
    },
  }),

  apply_to_vacancy: tool({
    description:
      "Postula al candidato a una vacante. Úsala solo cuando haya pedido claramente postularse a esa vacante concreta; si hay cualquier duda sobre cuál, pregunta antes.",
    input: z.object({ vacancyId: z.string() }),
    run: async ({ vacancyId }, turn) => {
      const vacancy = await getVacancy(vacancyId);
      if (!vacancy) return { error: `No existe la vacante ${vacancyId}.` };
      const applied = await listApplications(turn.profile.id);
      if (applied.some((a) => a.vacancyId === vacancyId)) {
        return { ok: true, nota: `Ya estaba postulado a ${vacancy.title}.` };
      }
      const application = await createApplication(turn.profile.id, vacancyId);
      await publish({
        profileId: application.profileId,
        vacancyId: application.vacancyId,
        applicationId: application.id,
        kind: "applied",
      });
      turn.actions.push({ type: "refresh" });
      return { ok: true, postulado_a: `${vacancy.title} en ${vacancy.company}` };
    },
  }),
};

type ToolName = keyof typeof TOOLS;

const DEFINITIONS: Anthropic.Tool[] = Object.entries(TOOLS).map(([name, t]) => ({
  name,
  description: t.description,
  input_schema: z.toJSONSchema(t.input) as Anthropic.Tool.InputSchema,
}));

function system(profile: Profile, path: string, tailored: boolean): string {
  const facts = {
    nombre: profile.fullName,
    ciudad: profile.city ?? null,
    habilidades: profile.skills.map((s) => s.name),
    experiencia: profile.experience.map((e) => `${e.title} en ${e.company}`),
    educacion: profile.education.map((e) => `${e.degree}, ${e.institution}`),
    expectativas: profile.expectations,
    faltaParaCompletar: profileCompleteness(profile).missing,
  };
  return `Eres Luna, la asistente de Moon Light, una app donde un candidato gestiona su perfil profesional, su hoja de vida y sus postulaciones. Hablas en español de Colombia, con calidez y en pocas frases.

Hoy es ${new Date().toISOString().slice(0, 10)}. El candidato está en la página ${path}.${tailored ? " Ya tiene una versión adaptada de su hoja de vida abierta; si pide más cambios, refínala con tailor_cv." : ""}

Perfil del candidato (JSON):
${JSON.stringify(facts, null, 2)}

Páginas: /dashboard (inicio), /jobs (vacantes), /jobs/<id> (una vacante), /applications (postulaciones), /cv (hoja de vida), /profile (perfil), /onboarding (editar perfil paso a paso), /import (importar una hoja de vida o LinkedIn).

Reglas:
- Usa las herramientas para hacer lo que pide. Di solo lo que las herramientas hicieron de verdad; si una falla, dilo y no finjas que funcionó.
- El perfil de arriba es como estaba al empezar esta respuesta; lo que cambies con update_profile aparece en el resultado de la herramienta.
- Habla de lo que hiciste en primera persona ("agregué", "busqué"), nunca de "el sistema".
- Postula a una vacante solo si el candidato lo pidió claramente para esa vacante. Si hay duda, pregunta primero.
- No inventes experiencia, habilidades ni cifras.
- Responde en texto plano, sin Markdown, en 1 a 4 frases. Al listar vacantes, una por línea con cargo, empresa y puntaje.`;
}

/** Leading assistant turns are dropped: the conversation sent to the model must open with the candidate. */
function history(messages: ChatMessage[]): Anthropic.MessageParam[] {
  const start = messages.findIndex((m) => m.role === "user");
  return messages.slice(start).map((m) => ({ role: m.role, content: m.content }));
}

async function runTool(block: Anthropic.ToolUseBlock, turn: Turn): Promise<unknown> {
  const t = TOOLS[block.name as ToolName] as Tool<z.ZodType> | undefined;
  if (!t) return { error: `Herramienta desconocida: ${block.name}` };
  const input = t.input.safeParse(block.input);
  if (!input.success) return { error: `Entrada inválida: ${input.error.message}` };
  return t.run(input.data, turn);
}

/**
 * One answer from Luna: the model calls tools until it can reply, each tool
 * acting on the real data and queuing what the browser must do afterwards.
 */
export async function answer(
  profile: Profile,
  messages: ChatMessage[],
  path: string,
  tailored?: z.infer<typeof Draft>,
): Promise<{ reply: string; actions: AssistantAction[] }> {
  const turn: Turn = { profile, tailored, actions: [] };
  const conversation = history(messages);
  // Fixed for the whole answer: rebuilt after a save, the prompt would show the
  // model its own change as if the candidate already had it.
  const prompt = system(profile, path, tailored !== undefined);

  for (let round = 0; round <= MAX_ROUNDS; round++) {
    const response = await claude().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: prompt,
      tools: DEFINITIONS,
      messages: conversation,
    });

    if (response.stop_reason !== "tool_use") {
      const reply = response.content
        .flatMap((b) => (b.type === "text" ? [b.text] : []))
        .join("\n")
        .trim();
      if (!reply) break;
      return { reply, actions: turn.actions };
    }

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const result = await runTool(block, turn);
      results.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result),
        is_error: typeof result === "object" && result !== null && "error" in result,
      });
    }
    conversation.push(
      { role: "assistant", content: response.content },
      { role: "user", content: results },
    );
  }

  throw new UserFacingError(
    "Luna no alcanzó a terminar esa tarea. Intenta pedirla en un paso más corto.",
  );
}
