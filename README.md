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

Status: the MVP runs. A seeded candidate, 20 vacancies, five screens and a scored, explained
ranking. Delivery 1 is due **19 August 2026**, checklist in
[`docs/deliverables/delivery-1/`](docs/deliverables/delivery-1/README.md).

## Layout

```text
moonlight/
├── apps/
│   ├── web/            # Next.js: onboarding wizard, dashboard, ranked jobs, status board
│   │   ├── app/api/    #   Next API routes, branch A of the comparison PoC
│   │   ├── components/ #   the shell and the pieces every screen reuses
│   │   └── lib/        #   server loaders and the browser side of the API
│   ├── api/            # Express service, branch B of the comparison PoC
│   └── agents/         # LangGraph agents, release 2+
├── packages/
│   ├── core/           # domain: scoring, completeness, market gaps, status machine. Zero IO
│   ├── db/             # PostgreSQL: migrations, seeds, repositories
│   └── types/          # shapes shared across boundaries
├── data/               # our own job dataset and fictional sample profiles
├── docs/               # deliverables, diagrams, sketches, ADRs
├── infra/              # local Postgres, n8n workflow exports
└── tests/e2e/
```

## Getting started

Docker and Node 22 are the only prerequisites.

```bash
pnpm install
cp .env.example .env.local   # optional: the defaults already match db:up

pnpm db:up                   # PostgreSQL 17 on :5433
pnpm db:migrate              # forward-only, re-runnable
pnpm db:seed                 # 20 vacancies, one candidate, six applications

pnpm dev                     # http://localhost:3000
```

The seed makes the app usable immediately: `/dashboard` shows the candidate's completeness and
top matches, `/jobs` the whole list by score, `/jobs/v003` one recommendation worked through,
`/applications` the status board, and `/onboarding` the wizard, pre-filled.

The endpoints are real and inspectable, which is what the delivery video shows:

```bash
curl localhost:3000/api/health
curl localhost:3000/api/vacancies | head -c 400
curl localhost:3000/api/profiles/demo-candidate/recommendations | head -c 400
curl "localhost:3000/api/applications?profileId=demo-candidate" | head -c 400
```

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

## Team

| Name              | Role                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| Pablo Manjarrés   | Team lead and development. Architecture, backlog, MVP, proof of concept, coordination with the external contacts |
| Valentina Barbosa | Documentation and communication. Delivery document, presentation, prior art, sketches, video                     |

## License

Apache License 2.0. See [LICENSE](LICENSE).

---

<p align="center">
  Ingeniería de Software (SI2005) · Universidad EAFIT · 2026-2 · Profile Manager challenge by Magneto
</p>
