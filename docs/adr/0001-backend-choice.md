# 1. Next API routes over a standalone Express service

Date: 2026-08-17
Status: accepted

## Context

The Delivery 1 plan required comparing two backend options under explicit criteria rather than
picking one by preference. Both were built: `apps/web/app/api/` on Next route handlers and
`apps/api/` as an Express service. Both call the same engine in `packages/core` and return
byte-identical payloads, so the comparison isolates transport and runtime.

Measured with `pnpm bench`: 200 requests per route after 20 warmup requests, Next built for
production, both against the same database.

| Route                           | Next p50 | Next p95 | Express p50 | Express p95 |
| ------------------------------- | -------- | -------- | ----------- | ----------- |
| `/vacancies`                    | 3.2 ms   | 5.0 ms   | 2.8 ms      | 4.0 ms      |
| `/profiles/:id/recommendations` | 4.2 ms   | 5.1 ms   | 3.3 ms      | 4.6 ms      |

Express is faster by 0.4 ms (p50) on `/vacancies` and 0.9 ms on the recommendations route. The
other criteria: Next needs one file per route and no server bootstrap, no CORS and no second
process, against one server file plus a dependency, a second process and CORS once a browser calls
it; Next is tied to its runtime where Express is portable to any Node host; one deployment against
two; and one stack for two people to learn and run against two things to start, watch and debug.

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
