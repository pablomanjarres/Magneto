<p align="center">
  <img src=".github/banner.webp" alt="Match" width="100%" />
</p>

<h1 align="center">Match</h1>

<p align="center"><em>A profile driven to 100%, and jobs ranked by a score the candidate can actually read.</em></p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" />
  <img alt="Node.js 22" src="https://img.shields.io/badge/Node.js_22-5FA04E?style=flat&logo=nodedotjs&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white" />
  <img alt="PostgreSQL 17" src="https://img.shields.io/badge/PostgreSQL_17-4169E1?style=flat&logo=postgresql&logoColor=white" />
  <img alt="Turborepo" src="https://img.shields.io/badge/Turborepo-EF4444?style=flat&logo=turborepo&logoColor=white" />
  <img alt="License Apache 2.0" src="https://img.shields.io/badge/license-Apache_2.0-c8542a?style=flat" />
  <img alt="status planning" src="https://img.shields.io/badge/status-planning-e0a642?style=flat" />
  <img alt="EAFIT SI2005" src="https://img.shields.io/badge/EAFIT-SI2005_2026--2-c8542a?style=flat" />
</p>

Match is our answer to the Profile Manager challenge from **Magneto**, built for Ingeniería de Software (SI2005) at Universidad EAFIT, 2026-2.

Job seekers register on a portal, leave the profile half-filled, and wait to be contacted, which quietly destroys match quality for everyone. Match flips that: a wizard takes a résumé and a set of expectations, the system says exactly what is missing to hit 100%, and it ranks jobs by a weighted score that comes with its reasons attached. The MVP runs locally against our own job dataset, because the challenge gives no access to real Magneto postings.

This repository is the whole submission. Code and every graded artifact live here, so the link to this repo is the delivery.

## Status

Planning. Nothing is built yet. Everything below is the blueprint the work lands in.

| Deliverable | Due | Weight |
|---|---|---|
| Delivery 1, work plan | Wednesday, 19 August 2026 | 20% |
| Delivery 2 | TBD | 20% |
| Delivery 3, with defense | TBD | 20% |

## Layout

```text
match/
├── apps/
│   ├── web/            # Next.js: onboarding wizard, dashboard, ranked jobs, status board
│   │   └── app/api/    #   Next API routes, branch A of the comparison PoC
│   ├── api/            # Express service, branch B of the comparison PoC
│   └── agents/         # LangGraph agents, release 2+
├── packages/
│   ├── core/           # domain: entities, use cases, scoring engine. Zero IO
│   ├── db/             # PostgreSQL: migrations, seeds, repositories
│   └── types/          # shapes shared across boundaries
├── data/               # our own job dataset and fictional sample profiles
├── docs/
│   ├── deliverables/   # document · presentation · video · evidence, per delivery
│   ├── diagrams/       # context, interaction, entity-relationship
│   └── sketches/       # screen sketches
├── infra/              # local Postgres, n8n workflow exports
└── tests/e2e/
```

### Where things go

| Path | What lands here |
|---|---|
| `apps/web/` | `app/onboarding/` wizard · `app/dashboard/` completeness · `app/jobs/` ranking and detail · `app/applications/` status board · `components/` shared UI · `lib/` client helpers |
| `apps/api/` | `src/routes/` endpoints · `src/middleware/` JWT, roles, validation, rate limiting · `openapi/` the API contract |
| `apps/agents/` | Résumé extraction, gap detection, follow-up. Release 2 and later |
| `packages/core/` | `src/domain/` entities · `src/application/` use cases · `src/scoring/` the weighted engine · `tests/` unit tests |
| `packages/db/` | `migrations/` forward-only schema · `seeds/` the dataset loader · `src/repositories/` |
| `packages/types/` | Request, response and DTO shapes shared between the frontend and the services |
| `data/` | `jobs/` the dataset the recommender scores against · `sample-profiles/` fictional candidates |
| `docs/deliverables/delivery-N/` | `document/` the template doc · `presentation/` slides · `video/` the 5-minute demo · `evidence/` screenshots and minutes |
| `docs/diagrams/`, `docs/sketches/` | Design artifacts, drawn by hand |
| `infra/` | `docker-compose.yml` local PostgreSQL 17 · `n8n/` exported workflows |
| `.github/` | Issue templates for user stories, non-functional stories and tasks, plus the PR checklist |

Clean architecture is a package boundary, not a convention: `packages/core` imports nothing, so business rules cannot reach the database or the framework even by accident. `apps/*` are entrypoints into those rules.

Both `apps/web/app/api/` and `apps/api/` exist on purpose. Delivery 1 left the backend choice open between Next API routes and a standalone Express service, so both get measured before one is deleted.

## Stack

Next.js · React · TypeScript · Node 22 · Express · PostgreSQL 17 · pnpm workspaces · Turborepo · Docker Compose · ESLint and Prettier. LangGraph and n8n from release 2.

## Getting started

Nothing to run yet. Once the apps are scaffolded:

```bash
pnpm install
cp .env.example .env.local   # fill DATABASE_URL, generate JWT_SECRET

pnpm db:up                   # PostgreSQL 17 on :5432
pnpm db:migrate
pnpm db:seed

pnpm dev                     # Next.js and the API together
```

Secrets never enter the repo. `.env` is gitignored and every variable is documented in [`.env.example`](.env.example).

### Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
```

All four have to pass before a pull request is merged.

## Two rules from the course

The delivery document cannot be AI-generated, and no AI may produce design artifacts. That covers everything in `docs/sketches/` and `docs/diagrams/`, which are drawn by hand. Any other AI use is declared with its prompts in the delivery document.

## Team

| Name | Role |
|---|---|
| Pablo Manjarrés | Team lead and development. Architecture, backlog, coordination with the external contacts |
| Miguel Ángel Riveros | Development. MVP features, proof of concept, dev and test environment |
| Valentina Barbosa | Documentation and communication. Delivery document, presentation, prior art, sketches, video |

Product Owner: Magneto. Technical lead and monitor: to be confirmed.

## License

Apache License 2.0. See [LICENSE](LICENSE).

---

<p align="center">
  Ingeniería de Software (SI2005) · Universidad EAFIT · 2026-2 · Profile Manager challenge by Magneto
</p>
