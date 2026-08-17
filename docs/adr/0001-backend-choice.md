# 1. Next API routes over a standalone Express service

Date: 2026-08-17
Status: accepted

## Context

The Delivery 1 plan required comparing two backend options under explicit criteria rather than
picking one by preference. Both were built: `apps/web/app/api/` on Next route handlers and
`apps/api/` as an Express service. Both call the same engine in `packages/core` and return
byte-identical payloads, so the comparison isolates transport and runtime.

Measurements and the full criteria table are in [`../poc-comparison.md`](../poc-comparison.md).
Express is faster by 0.4 ms (p50) on `/vacancies` and 0.9 ms on the recommendations route.

## Decision

Use Next API routes. Delete `apps/api/` once Delivery 1 has been graded; it is the evidence for
the comparison until then.

## Consequences

- One process to start, deploy and debug instead of two. No CORS, no second port.
- Server components read the database directly, skipping the HTTP hop entirely for page loads.
- Roughly 0.9 ms more latency per request on the heaviest route. Accepted.
- The backend is now tied to the Next runtime. Moving off it means rewriting the route handlers,
  though `packages/core` and `packages/db` would carry over untouched, which is the reason the
  engine has zero IO in the first place.
