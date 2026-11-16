import { UserFacingError } from "./errors";

const ACTOR_URL =
  "https://api.apify.com/v2/acts/atomus~linkedin-profile-scraper/run-sync-get-dataset-items?timeout=120";

/**
 * Scrapes one public LinkedIn profile through Apify and returns the scraper's
 * record, for `mapLinkedInProfile`. `url` must already be canonical.
 */
export async function fetchLinkedInProfile(url: string): Promise<unknown> {
  const token = process.env["APIFY_TOKEN"];
  if (!token) {
    throw new UserFacingError(
      "La importación desde LinkedIn no está configurada en este servidor.",
    );
  }

  let response: Response;
  try {
    response = await fetch(ACTOR_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ profileUrls: [url] }),
      // The actor itself stops at 120 s; this leaves room for the answer to arrive.
      signal: AbortSignal.timeout(150_000),
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "TimeoutError") {
      throw new UserFacingError(
        "LinkedIn tardó demasiado en responder. Intenta de nuevo en un rato.",
      );
    }
    throw new UserFacingError(
      "No pudimos conectarnos con LinkedIn. Revisa tu conexión e intenta de nuevo.",
    );
  }

  if (!response.ok) {
    throw new UserFacingError(
      response.status === 402 || response.status === 429
        ? "El servicio de importación está saturado. Intenta de nuevo más tarde o sube tu hoja de vida."
        : "No pudimos leer ese perfil de LinkedIn ahora. Intenta de nuevo o sube tu hoja de vida.",
    );
  }

  const items: unknown = await response.json().catch(() => null);
  const first = Array.isArray(items)
    ? (items[0] as Record<string, unknown> | undefined)
    : undefined;
  const status = first?.["status"];

  if (!first || status === "not_found") {
    throw new UserFacingError("No encontramos ese perfil de LinkedIn. Revisa que sea público.");
  }
  if (status !== "success") {
    throw new UserFacingError(
      "LinkedIn no nos dejó leer ese perfil. Intenta de nuevo o sube tu hoja de vida.",
    );
  }
  return first;
}
