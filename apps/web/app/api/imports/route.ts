import { canonicalLinkedInUrl, mapLinkedInProfile } from "@moonlight/core";
import type { ImportedProfile, ImportEvent } from "@moonlight/types";

import { fetchLinkedInProfile } from "../../../lib/apify";
import { UserFacingError } from "../../../lib/errors";
import { withRequestLog } from "../../../lib/log";
import { rateLimit } from "../../../lib/rate-limit";
import { mapResume, readResume } from "../../../lib/resume";

export const dynamic = "force-dynamic";
// Scraping a profile can take two minutes.
export const maxDuration = 180;

const MAX_PDF_BYTES = 5 * 1024 * 1024;
const PDF_MAGIC = "%PDF-";

const badRequest = (error: string): Response => Response.json({ error }, { status: 400 });

/** Streams each step as it really happens; any failure ends with one error event. */
function stream<T>(
  first: "fetching" | "reading",
  load: () => Promise<T>,
  map: (raw: T) => ImportedProfile,
): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ImportEvent): void =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        send({ phase: first });
        const raw = await load();
        send({ phase: "mapping" });
        send({ phase: "done", imported: map(raw) });
      } catch (cause) {
        if (!(cause instanceof UserFacingError)) {
          // Logged without the request body: only the failure itself.
          console.error("import failed", cause instanceof Error ? cause.message : "unknown");
        }
        send({
          phase: "error",
          message:
            cause instanceof UserFacingError
              ? cause.message
              : "Algo falló al importar tu perfil. Intenta de nuevo.",
        });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}

async function fromLinkedIn(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const raw =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)["url"]
      : undefined;
  const url = typeof raw === "string" ? canonicalLinkedInUrl(raw) : null;
  if (!url) {
    return badRequest(
      "Ese enlace no es un perfil de LinkedIn. Debe verse como linkedin.com/in/tu-nombre.",
    );
  }
  return stream("fetching", () => fetchLinkedInProfile(url), mapLinkedInProfile);
}

async function fromResume(request: Request): Promise<Response> {
  // Refuse an oversized upload before reading it; the form adds a little overhead.
  if (Number(request.headers.get("content-length") ?? 0) > MAX_PDF_BYTES + 64 * 1024) {
    return badRequest("El PDF pesa más de 5 MB. Sube uno más liviano.");
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return badRequest("Adjunta tu hoja de vida en PDF.");
  if (file.size === 0) return badRequest("El archivo está vacío.");
  if (file.size > MAX_PDF_BYTES)
    return badRequest("El PDF pesa más de 5 MB. Sube uno más liviano.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  // The content decides, not the name or the declared type.
  if (new TextDecoder().decode(bytes.subarray(0, PDF_MAGIC.length)) !== PDF_MAGIC) {
    return badRequest("Ese archivo no es un PDF. Sube tu hoja de vida en PDF.");
  }
  return stream("reading", () => readResume(bytes), mapResume);
}

export const POST = withRequestLog("POST /api/imports", async (request: Request) => {
  const limited = rateLimit(request, "imports", 5, 60 * 60 * 1000);
  if (limited) return limited;

  const type = request.headers.get("content-type") ?? "";
  if (type.startsWith("multipart/form-data")) return fromResume(request);
  if (type.startsWith("application/json")) return fromLinkedIn(request);
  return badRequest("Envía un enlace de LinkedIn o una hoja de vida en PDF.");
});
