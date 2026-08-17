# Comparison PoC: Next route handlers vs a standalone Express service

Delivery 1 left the backend open. Both branches were built and measured instead of argued about.

Both expose the same four endpoints (`/health`, `/vacancies`, `POST /profiles`,
`/profiles/:id/recommendations`), call the same scoring engine from `packages/core`, and read the
same PostgreSQL database. Their JSON responses are byte-identical, verified by diffing the two
payloads. Whatever differs below is transport and runtime, not logic.

## Performance

200 requests per route after 20 warmup requests, Next built for production (`next build && next
start`), both on the same machine against the same database. Reproduce with `pnpm bench`.

| Route                           | Next p50 | Next p95 | Express p50 | Express p95 |
| ------------------------------- | -------- | -------- | ----------- | ----------- |
| `/vacancies`                    | 3.2 ms   | 5.0 ms   | 2.8 ms      | 4.0 ms      |
| `/profiles/:id/recommendations` | 4.2 ms   | 5.1 ms   | 3.3 ms      | 4.6 ms      |

Express wins by 0.4 ms and 0.9 ms. Real, repeatable, and smaller than the jitter of a single
network hop.

## The other criteria

| Criterion             | Next route handlers                                         | Express service                                                                       |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Implementation effort | Four files, no server bootstrap, no CORS, no second process | One server file plus a dependency, a second process, and CORS once a browser calls it |
| Technical limits      | Tied to the Next runtime and its deployment model           | Portable to any Node host                                                             |
| Cost                  | One process, one deployment                                 | Two processes, two deployments                                                        |
| Sustainability        | One stack for two people to learn and run                   | Two things to start, watch and debug                                                  |

The page at `apps/web/app/page.tsx` reads the database directly from a server component, with no
HTTP hop at all. Express cannot offer that.

## Decision

**Next API routes.** The measured gap is under a millisecond, and the team is two people who both
have to be able to run the demo and explain the code. One process is worth more than 0.9 ms.

Recorded in [`adr/0001-backend-choice.md`](adr/0001-backend-choice.md). `apps/api/` stays in the
repository until Delivery 1 is graded, because it is the evidence for this comparison.
