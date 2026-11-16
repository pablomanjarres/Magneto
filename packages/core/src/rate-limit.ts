/**
 * A sliding-window limit, pure so it can be tested without a clock: the caller
 * keeps the timestamps and passes `now`. Hits older than the window drop out.
 */
export function takeToken(
  hits: readonly number[],
  now: number,
  limit: number,
  windowMs: number,
): { ok: true; hits: number[] } | { ok: false; hits: number[]; retryAfterSeconds: number } {
  const recent = hits.filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    const oldest = Math.min(...recent);
    return {
      ok: false,
      hits: recent,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }
  return { ok: true, hits: [...recent, now] };
}
