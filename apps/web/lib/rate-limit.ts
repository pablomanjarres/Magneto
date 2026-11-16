import { takeToken } from "@moonlight/core";

// In memory: the app runs as one local process, so a Map is the whole store.
const buckets = new Map<string, number[]>();

/**
 * A 429 with Retry-After once a client passes `limit` requests in `windowMs`
 * on one bucket, or null when the request may go ahead.
 */
export function rateLimit(
  request: Request,
  bucket: string,
  limit: number,
  windowMs: number,
): Response | null {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${bucket}:${ip}`;
  const result = takeToken(buckets.get(key) ?? [], Date.now(), limit, windowMs);
  buckets.set(key, result.hits);
  if (result.ok) return null;
  const minutes = Math.ceil(result.retryAfterSeconds / 60);
  const wait = minutes > 1 ? `${minutes} minutos` : "un minuto";
  return Response.json(
    { error: `Demasiados intentos. Vuelve a intentarlo en ${wait}.` },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
  );
}
