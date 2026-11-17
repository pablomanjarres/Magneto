import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { dedupeSkills, toYearMonth } from "@moonlight/core";
import type { ImportedProfile } from "@moonlight/types";
import { z } from "zod";

import { UserFacingError } from "./errors";
import { CLAUDE_MODEL, budgeted, claude } from "./claude";

// Every field is a string so "not in the document" is always the same thing: "".
const Resume = z.object({
  fullName: z.string(),
  email: z.string(),
  city: z.string(),
  headline: z.string(),
  experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      description: z.string(),
    }),
  ),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      startYear: z.string(),
      endYear: z.string(),
    }),
  ),
  skills: z.array(z.string()),
});

const PROMPT = `Lee esta hoja de vida y extrae los datos del candidato.
Copia solo lo que el documento dice, con sus mismas palabras. Nunca inventes, completes ni supongas nada.
Si un dato no aparece, deja ese campo como texto vacío "".
- fullName: nombre completo. email: su correo. city: ciudad donde vive. headline: cargo o titular que se da a sí mismo.
- experience: cada cargo, con fechas como "YYYY-MM" (o "YYYY" si solo hay año); endDate vacío si es su cargo actual.
- education: cada estudio, con startYear y endYear como años de cuatro dígitos.
- skills: cada habilidad o tecnología que el documento nombra, una por elemento.`;

const yearOrUndefined = (v: string): number | undefined => {
  const match = /\b(19|20)\d{2}\b/.exec(v);
  return match ? Number(match[0]) : undefined;
};

type Resume = z.infer<typeof Resume>;

/** Reads a PDF résumé with Claude: only what the document states, still raw. */
export async function readResume(pdf: Uint8Array): Promise<Resume> {
  let response;
  try {
    response = await budgeted("resume", () =>
      claude().messages.parse({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: Buffer.from(pdf).toString("base64"),
                },
              },
              { type: "text", text: PROMPT },
            ],
          },
        ],
        output_config: { format: zodOutputFormat(Resume) },
      }),
    );
  } catch (cause) {
    if (cause instanceof Anthropic.RateLimitError) {
      throw new UserFacingError("Hay muchas hojas de vida en fila. Intenta de nuevo en un minuto.");
    }
    if (cause instanceof Anthropic.BadRequestError) {
      throw new UserFacingError(
        "No pudimos leer ese PDF. Revisa que no tenga contraseña y que tenga texto, no solo imágenes.",
      );
    }
    if (cause instanceof Anthropic.APIError) {
      throw new UserFacingError(
        "No pudimos leer tu hoja de vida ahora. Intenta de nuevo en un rato.",
      );
    }
    throw cause;
  }

  const parsed = response.parsed_output;
  if (response.stop_reason === "refusal" || !parsed) {
    throw new UserFacingError(
      "No logramos sacar datos de ese documento. Prueba con otra hoja de vida o llena tu perfil a mano.",
    );
  }

  return parsed;
}

/** The fields Claude read, in the shapes the profile uses. */
export function mapResume(parsed: Resume): ImportedProfile {
  return {
    source: "resume",
    fullName: parsed.fullName.trim() || undefined,
    email: /^\S+@\S+\.\S+$/.test(parsed.email.trim()) ? parsed.email.trim() : undefined,
    city: parsed.city.trim() || undefined,
    headline: parsed.headline.trim() || undefined,
    experience: parsed.experience
      .filter((e) => e.company.trim() && e.title.trim())
      .map((e) => ({
        company: e.company.trim(),
        title: e.title.trim(),
        startDate: toYearMonth(e.startDate),
        endDate: toYearMonth(e.endDate) || undefined,
        description: e.description.trim() || undefined,
        source: "resume" as const,
      })),
    education: parsed.education
      .filter((e) => e.institution.trim() && e.degree.trim())
      .map((e) => ({
        institution: e.institution.trim(),
        degree: e.degree.trim(),
        // 0 is what the LinkedIn mapper uses too: the review screen asks for it.
        startYear: yearOrUndefined(e.startYear) ?? 0,
        endYear: yearOrUndefined(e.endYear),
        source: "resume" as const,
      })),
    skills: dedupeSkills(parsed.skills.map((s) => s.trim())).map((name) => ({
      name,
      source: "resume" as const,
    })),
  };
}
