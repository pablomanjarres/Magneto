# Delivery 1 — Team work plan

Due **Wednesday 19 August 2026**. Worth 20% of the course grade.

The graded document itself lives in [`document/`](document/) and is written by hand. This file only tracks what is finished, who owns it, and where the evidence is. Owners follow the team split: Pablo leads development and the backlog, Valentina leads the document and the design artifacts.

Legend: `[x]` done, `[~]` in progress, `[ ]` not started.

## Document data

| | Item | Owner |
|---|---|---|
| `[x]` | Product name defined: **Moon Light** | Pablo |
| `[ ]` | Header on every page: product name, logo, team members, version 1.0 | Valentina |
| `[ ]` | Every bracketed placeholder and highlight removed from the template | Valentina |
| `[ ]` | Table of contents regenerated | Valentina |
| `[ ]` | Each member's contribution stated explicitly | Valentina |

Logo files for the header are in [`assets/brand/svg/`](../../../assets/brand/svg/). Use `logo.svg`, or `logo-flat.svg` if the gradient prints badly.

## Section 1 — Generalidades

| | Item | Owner |
|---|---|---|
| `[ ]` | 1.1 Problem and solution: the candidate leaves the profile incomplete and waits to be contacted, which degrades match quality. The proposal is the portal with a 100% profile and an explainable ranking | Valentina |
| `[ ]` | 1.2 People and roles table | Valentina |
| `[ ]` | 1.3 Context diagram: candidate, recruiter, vacancy source, PostgreSQL, and Magneto as a future integration. Each actor gets a short description of what it does in the system | Pablo |
| `[ ]` | 1.4 Interaction process: the candidate flow (signup, onboarding wizard, ranked vacancies, application, status tracking) plus a second flow for the admin profile | Pablo |

The context diagram is a design artifact. Draw it by hand, no AI.

## Section 2 — Antecedentes

| | Item | Owner |
|---|---|---|
| `[ ]` | Three similar applications with URL, screenshots, and what separates each one from ours. Candidates: Magneto, LinkedIn Jobs, and Computrabajo or elempleo | Valentina |
| `[ ]` | Our own differentiator: the completeness bar, and a visible reason attached to every recommendation | Valentina |

Worth using here: Jobscan and Teal compare one resume against one vacancy. Moon Light measures gaps against the whole vacancy set, so profile completeness follows what the market is actually asking for.

## Section 3 — Artefactos ágiles

| | Item | Owner |
|---|---|---|
| `[ ]` | 3.1 Weekly ceremonies reported in the Teams channel | Pablo, Valentina records |
| `[ ]` | 3.1 Mandatory meeting with the Product Owner (Juan Camilo or Luis Miguel) or the Technical Lead (Santiago Manco). It is graded, so book it early | Pablo |
| `[~]` | 3.2 Product vision and story mapping filled in `Entrega1_Visioning.xlsx` or the Miro template, with a screenshot in the document | Valentina |
| `[x]` | 3.3 Product backlog on GitHub, minimum 20 user stories. **34 created.** Screenshot and link | Pablo |
| `[x]` | 3.3 Non-functional stories marked `HU_NF`. **5 created**, covering the five areas from section 10 of the Magneto brief | Pablo |
| `[x]` | 3.4 Sprint backlog with acceptance criteria, owner and tasks per story. Screenshot and link | Valentina, Pablo support |

- Backlog: https://github.com/pablomanjarres/Magneto/issues
- Board: https://github.com/users/pablomanjarres/projects/3

The board carries Owner, Release, Sprint, Activity and Points per story. The "Sprint Backlog 1" view holds the 14 stories scoped for this delivery. Acceptance criteria and tasks live inside each issue.

3.2 is the open one. The story map is still missing the four objectives-and-preferences stories, resume upload, dataset loading, market-wide gaps, and all five `HU_NF`. It also needs the persona filled in and the Release 1/2/3 rows drawn. Until that lands, the map and the backlog disagree and the document has to reconcile them.

## Section 4 — Sketches

One screen per activity in the flow. **No AI on any of these.** Hand-drawn or Balsamiq only.

| | Screen | Owner |
|---|---|---|
| `[ ]` | Onboarding wizard steps (resume and expectations) | Valentina |
| `[ ]` | Dashboard with the completeness bar | Valentina |
| `[ ]` | Vacancy list ordered by score | Valentina |
| `[ ]` | Vacancy detail with the recommendation explained | Valentina |
| `[ ]` | Status board: applied, under review, interview, rejected | Valentina |

Finished sketches go in [`../../sketches/`](../../sketches/).

## Section 5 — Proof of concept and initial features

| | Item | Owner |
|---|---|---|
| `[ ]` | Environment PoC: Next.js running, an endpoint responding, and PostgreSQL connected with a seeded table. The hello world of each technology | Pablo |
| `[ ]` | Comparison PoC: Next API routes against a standalone Express service, judged on performance, implementation effort, technical limits, and cost, plus the sustainability criterion the template asks for | Pablo |
| `[ ]` | Seeded vacancy dataset | Valentina |
| `[ ]` | MVP with the full input, process, output flow: load the profile and expectations, store it, score it against the seeded vacancies, show the ordered list | Pablo |
| `[ ]` | Video of roughly 5 minutes: problem, proposed solution, and the proof of concept demonstrated | Valentina, Pablo support |

The comparison PoC decides the backend, so its result has to be recorded as an ADR in [`../../adr/`](../../adr/). Both `apps/web/app/api/` and `apps/api/` stay in the repo until that decision is written down.

The video has to show the endpoint returning JSON and rows in the database for a few seconds, not only the interface.

## Section 6 — Referencias

| | Item | Owner |
|---|---|---|
| `[ ]` | Sources used | Valentina |
| `[ ]` | Every AI tool used, with its prompts. AI is allowed, but it has to be declared | Valentina, Pablo support |

## Rules that void the work

- The template document cannot be AI-generated.
- No AI for design artifacts, which covers the sketches and the context diagram.
- If the delivery is not defended in person, the written work is not accepted.
- Either member can be picked to present, and both take part. Both have to be able to run the demo and explain the code.
- Delivery goes through the group Teams channel or Interactiva Virtual. If everything is in the GitHub repository, sharing the link is enough and the review happens there.
