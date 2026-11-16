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

const Output = z.object({
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

const RULES = `Reglas estrictas:
- Usa solo hechos que estén en el perfil. Nunca agregues empresas, cargos, fechas, títulos, habilidades ni cifras.
- Copia company, title, startDate y endDate de cada experiencia exactamente como vienen (endDate null si no tiene). Incluye cada experiencia una sola vez.
- Las habilidades deben ser solo las del perfil, escritas igual.
- Puedes reordenar y reescribir descripciones, pero sin afirmar nada que el perfil no diga.
- No supongas el género del candidato: escribe en primera persona o con frases que no lo marquen.`;

function prompt(profile: Profile, vacancy: Vacancy): string {
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
  const asks = vacancy.requirements.map(
    (r) => `${r.skill} (${r.kind === "must-have" ? "obligatorio" : "deseable"})`,
  );

  return `Adapta este perfil de candidato a una vacante. Escribe todo en español de Colombia.

Vacante: ${vacancy.title} en ${vacancy.company}.
Requisitos: ${asks.join(", ") || "no especificados"}.

Perfil (JSON):
${JSON.stringify(facts, null, 2)}

Devuelve:
- headline: una sola línea que presente al candidato para esta vacante.
- summary: 2 o 3 frases dirigidas a esta vacante.
- experience: las experiencias del candidato ordenadas por relevancia para la vacante, con descripciones reescritas para resaltar lo que la vacante pide.
- skills: las habilidades del candidato, primero las que la vacante pide.

${RULES}`;
}

/**
 * A version of the profile rewritten for one vacancy. Every answer goes through
 * core's anti-fabrication check; one retry names what was wrong, and a second
 * failure throws TailorError rather than show invented facts.
 */
export async function tailorProfile(profile: Profile, vacancy: Vacancy): Promise<TailoredProfile> {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt(profile, vacancy) }];
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
      vacancyId: vacancy.id,
      headline: parsed.headline,
      summary: parsed.summary,
      experience: parsed.experience.map((e) => ({ ...e, endDate: e.endDate ?? undefined })),
      skills: parsed.skills,
    };
    const check = checkTailored(profile, tailored);
    if (check.ok) return tailored;

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
