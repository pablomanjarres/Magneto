<p align="center">
  <img src="assets/brand/svg/logo.svg" alt="Moon Light" width="160" />
</p>

<h1 align="center">Moon Light</h1>

<p align="center"><em>A profile driven to 100%, and jobs ranked by a score the candidate can actually read.</em></p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" />
  <img alt="PostgreSQL 17" src="https://img.shields.io/badge/PostgreSQL_17-4169E1?style=flat&logo=postgresql&logoColor=white" />
  <img alt="Turborepo" src="https://img.shields.io/badge/Turborepo-EF4444?style=flat&logo=turborepo&logoColor=white" />
  <img alt="License Apache 2.0" src="https://img.shields.io/badge/license-Apache_2.0-c8542a?style=flat" />
  <img alt="EAFIT SI2005" src="https://img.shields.io/badge/EAFIT-SI2005_2026--2-c8542a?style=flat" />
</p>

Our answer to the Profile Manager challenge from **Magneto**, for Ingeniería de Software (SI2005) at Universidad EAFIT, 2026-2.

Candidates leave their profile half-filled and wait to be contacted, which wrecks match quality for everyone. Moon Light takes a résumé and a set of expectations, says exactly what is missing to reach 100%, and ranks jobs by a weighted score with its reasons attached. The MVP runs locally against our own dataset, since the challenge gives no access to real Magneto postings.

This repository is the whole submission. The link to it is the delivery.

Status: planning. Nothing is built yet. Delivery 1 is due **19 August 2026**, checklist in [`docs/deliverables/delivery-1/`](docs/deliverables/delivery-1/README.md).

## Layout

```text
moonlight/
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
├── docs/               # deliverables, diagrams, sketches, ADRs
├── infra/              # local Postgres, n8n workflow exports
└── tests/e2e/
```

`packages/core` imports nothing, so business rules cannot reach the database or the framework.

Both `apps/web/app/api/` and `apps/api/` exist on purpose. The backend choice is still open between Next API routes and a standalone Express service, so both get measured before one is deleted.

## Stack

Next.js · React · TypeScript · Node 22 · Express · PostgreSQL 17 · pnpm workspaces · Turborepo · Docker Compose. LangGraph and n8n from release 2.

TypeScript only, config included. `tsconfig.base.json` sets `allowJs: false` and ESLint fails any JavaScript file.

## Getting started

Nothing to run yet. Once the apps are scaffolded:

```bash
pnpm install
cp .env.example .env.local   # fill DATABASE_URL, generate JWT_SECRET

pnpm db:up                   # PostgreSQL 17 on :5432
pnpm db:migrate
pnpm db:seed

pnpm dev
```

Secrets never enter the repo. `.env` is gitignored and every variable is documented in [`.env.example`](.env.example).

All four have to pass before a pull request is merged:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
```

## Team

| Name | Role |
|---|---|
| Pablo Manjarrés | Team lead and development. Architecture, backlog, MVP, proof of concept, coordination with the external contacts |
| Valentina Barbosa | Documentation and communication. Delivery document, presentation, prior art, sketches, video |

Product Owner: Magneto. Technical lead and monitor: to be confirmed.

## License

Apache License 2.0. See [LICENSE](LICENSE).

---

<p align="center">
  Ingeniería de Software (SI2005) · Universidad EAFIT · 2026-2 · Profile Manager challenge by Magneto
</p>
