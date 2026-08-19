# Architecture

Clean architecture, enforced by package boundaries rather than by good intentions. The rule that
does the work: **`packages/core` imports nothing.** Not the database, not Next, not `pg`. Domain
rules therefore cannot reach infrastructure, and the scoring engine can be tested with plain
objects and no running Postgres.

```text
apps/web      apps/api          entrypoints. Route handlers and pages. No domain rules.
    │             │
    └──────┬──────┘
           ▼
     packages/core                the engine: scoring, completeness, market gaps, the status
           │                      machine. Pure functions. Zero IO, no clock, no randomness.
           ▼
    packages/types                the shapes both sides agree on. No logic at all.

     packages/db                  PostgreSQL: migrations, seeds, repositories. Imports types,
                                  never core. The only place that writes SQL.
```

## The dependency rule

| Package  | May import            | May never import              |
| -------- | --------------------- | ----------------------------- |
| `types`  | nothing               | everything                    |
| `core`   | `types`               | `db`, `next`, `pg`, `express` |
| `db`     | `types`, `pg`         | `core`, `next`, `express`     |
| `apps/*` | `types`, `core`, `db` | another app                   |

Two consequences worth stating. Moving off Next means rewriting `apps/web`, and nothing else.
And a bug in a score is a bug in one pure function, reproducible from a unit test.

## How a request travels

A page load never makes an HTTP call to our own API. The server component reads the repositories
directly through `apps/web/lib/queries.ts`, which is the reason the comparison PoC settled on Next
route handlers — see [`adr/0001-backend-choice.md`](adr/0001-backend-choice.md).

```text
browser ── GET /dashboard ──► server component ──► lib/queries ──► packages/db ──► PostgreSQL
                                     │
                                     └──► packages/core (score, completeness, gaps)

browser ── POST /api/applications ──► route handler ──► packages/db ──► PostgreSQL
                                            │
                                            └──► packages/core (validate the move)
```

Mutations go the other way: the browser calls the route handlers through
`apps/web/lib/client.ts`, then asks Next to refresh the server-rendered tree. The endpoints stay
real and inspectable, which is what the delivery video has to show.

`apps/api/` is the Express branch of the comparison PoC. It exposes the same endpoints, returns
the same payloads, and calls the same engine. It stays until Delivery 1 is graded, because it is
the evidence for the ADR.

## Data

| Table                  | Holds                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| `vacancies`            | one row per vacancy from `data/jobs/vacancies.json`                    |
| `vacancy_requirements` | one row per requirement, `must-have` or `nice-to-have`                 |
| `profiles`             | the candidate. Sub-objects stay JSONB: they are read and written whole |
| `applications`         | the candidate's own pipeline, one row per vacancy applied to           |

Migrations are forward only and each one is re-runnable, so `pnpm db:migrate` can be run twice
without a ledger table. Never edit a migration that has run; add the next one.

## Which candidate is this?

A candidate registers themselves at `/register`: sprint 1 imports nothing from LinkedIn, so a name
and an email is how a profile starts and `/onboarding` is what fills it.

**There is no sign-in, and this is not authentication.** `POST /api/candidates` puts the new
profile's id in a cookie, and `currentProfile()` in `apps/web/lib/queries.ts` reads it back. There
is no password and nothing is verified — editing the cookie makes you somebody else. It exists so
the app knows whose profile to draw, nothing more. Real authentication is HU_NF #32 and is not
built; the `JWT_*` variables in `.env.example` are still unread.

## Scoring, in one paragraph

A missing must-have costs three times what a missing nice-to-have costs. The score is earned
weight over total weight, rounded. That is the whole model, and it is deliberate: the candidate is
shown the arithmetic on the vacancy detail screen, and a number you can check beats a number from
an embedding you cannot. Embeddings are a later option, recorded as such in the brief.
