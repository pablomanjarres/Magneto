import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { checkTailored } from "@moonlight/core";
import type { Profile, TailoredProfile, Vacancy } from "@moonlight/types";

import { CLAUDE_MODEL, claude } from "./claude";
import { UserFacingError } from "./errors";

/** Claude could not adapt the profile without adding facts, even after one retry. */
export class TailorError extends UserFacingError {
  constructor(readonly problems: string[]) {
    super("No pudimos adaptar tu perfil sin inventar datos. Intenta de nuevo.");
    this.name = "TailorError";
  }
}

/** A rewritten profile as the model returns it, and as the browser sends it back to refine. */
export const Draft = z.object({
  headline: z.string(),
  summary: z.string(),
  experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      startDate: z.string(),
      endDate: z.string().nullable(),
      description: z.string(),
    }),
  ),
  skills: z.array(z.string()),
});

const Output = Draft.extend({ reply: z.string() });

const RULES = `Reglas estrictas:
- Usa solo hechos que estén en el perfil. Nunca agregues empresas, cargos, fechas, títulos, habilidades ni cifras.
- Copia company, title, startDate y endDate de cada experiencia exactamente como vienen (endDate null si no tiene). Incluye cada experiencia una sola vez.
- Las habilidades deben ser solo las del perfil, escritas igual.
- Puedes reordenar y reescribir descripciones, pero sin afirmar nada que el perfil no diga.
- No supongas el género del candidato: escribe en primera persona o con frases que no lo marquen.`;

/** The one prompt both kinds of tailoring share: the task, the profile's facts, what to return and the rules. */
function prompt(profile: Profile, task: string, returns: string): string {
  const facts = {
    nombre: profile.fullName,
    ciudad: profile.city ?? null,
    cargoObjetivo: profile.expectations.targetRole ?? null,
    habilidades: profile.skills.map((s) => s.name),
    experiencia: profile.experience.map((e) => ({
      company: e.company,
      title: e.title,
      startDate: e.startDate,
      endDate: e.endDate ?? null,
      description: e.description ?? "",
    })),
    educacion: profile.education.map((e) => ({
      institucion: e.institution,
      titulo: e.degree,
      desde: e.startYear,
      hasta: e.endYear ?? null,
    })),
  };

  return `${task}

Perfil (JSON):
${JSON.stringify(facts, null, 2)}

Devuelve:
${returns}

${RULES}`;
}

/**
 * Asks for a rewrite and puts every answer through core's anti-fabrication
 * check; one retry names what was wrong, and a second failure throws
 * TailorError rather than show invented facts.
 */
async function rewrite(
  profile: Profile,
  request: string,
  vacancyId?: string,
): Promise<{ tailored: TailoredProfile; reply: string }> {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: request }];
  let problems: string[] = [];

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await claude().messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      messages,
      output_config: { format: zodOutputFormat(Output) },
    });
    const parsed = response.parsed_output;
    if (response.stop_reason === "refusal" || !parsed) {
      problems = ["La respuesta no tenía el formato esperado."];
      break;
    }

    const tailored: TailoredProfile = {
      ...(vacancyId ? { vacancyId } : {}),
      headline: parsed.headline,
      summary: parsed.summary,
      experience: parsed.experience.map((e) => ({ ...e, endDate: e.endDate ?? undefined })),
      skills: parsed.skills,
    };
    const check = checkTailored(profile, tailored);
    if (check.ok) return { tailored, reply: parsed.reply };

    problems = check.problems;
    messages.push(
      { role: "assistant", content: JSON.stringify(parsed) },
      {
        role: "user",
        content: `Tu respuesta agrega o repite datos que no están en el perfil:\n- ${problems.join("\n- ")}\nCorrígela.\n\n${RULES}`,
      },
    );
  }

  throw new TailorError(problems);
}

/** A version of the profile rewritten for one vacancy. */
export async function tailorProfile(profile: Profile, vacancy: Vacancy): Promise<TailoredProfile> {
  const asks = vacancy.requirements.map(
    (r) => `${r.skill} (${r.kind === "must-have" ? "obligatorio" : "deseable"})`,
  );
  const task = `Adapta este perfil de candidato a una vacante. Escribe todo en español de Colombia.

Vacante: ${vacancy.title} en ${vacancy.company}.
Requisitos: ${asks.join(", ") || "no especificados"}.`;
  const returns = `- headline: una sola línea que presente al candidato para esta vacante.
- summary: 2 o 3 frases dirigidas a esta vacante.
- experience: las experiencias del candidato ordenadas por relevancia para la vacante, con descripciones reescritas para resaltar lo que la vacante pide.
- skills: las habilidades del candidato, primero las que la vacante pide.
- reply: una frase que resuma qué cambiaste.`;

  const { tailored } = await rewrite(profile, prompt(profile, task, returns), vacancy.id);
  return tailored;
}

/**
 * The hoja de vida rewritten from the candidate's own instructions. `current`
 * is the version written last, so a new instruction refines it instead of
 * starting over.
 */
export async function tailorFromInstructions(
  profile: Profile,
  instructions: string,
  current?: z.infer<typeof Draft>,
): Promise<{ tailored: TailoredProfile; reply: string }> {
  const task = `Ajusta la hoja de vida de este candidato según sus instrucciones. Escribe en español de Colombia, salvo que pida otro idioma.
${current ? `\nVersión actual (JSON), la que debes refinar:\n${JSON.stringify(current, null, 2)}\n` : ""}
Instrucciones del candidato: ${instructions}

Si las instrucciones piden algo que no está en el perfil (por ejemplo cifras o habilidades que no tiene), no lo inventes y dilo en reply.`;
  const returns = `- headline: una sola línea que presente al candidato.
- summary: 2 o 3 frases.
- experience: las experiencias del candidato en el orden que mejor sirva a las instrucciones, con descripciones reescritas; omite alguna solo si las instrucciones lo piden.
- skills: las habilidades del candidato, en el orden que mejor sirva a las instrucciones.
- reply: una o dos frases en español que digan qué cambiaste.`;

  return rewrite(profile, prompt(profile, task, returns));
}
