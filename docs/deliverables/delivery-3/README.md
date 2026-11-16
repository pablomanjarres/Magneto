# Entrega 3 — Producto funcional (date to agree with the PO)

Every item below is a requirement written in the course template, `Entrega3_Final` (the version
the professor updated on 23 Oct 2026). A box is ticked only when the thing exists in this
repository, not when it has been discussed.

- Backlog: https://github.com/pablomanjarres/Magneto/issues
- Board: https://github.com/users/pablomanjarres/projects/3
- Document: [`document/Entrega3.md`](document/Entrega3.md)

**Status: 34 of 59 done.** Verified against the repository on 2026-11-16.

## Roles

The same as in Entrega 1 and 2.

| Persona       | Nombre                                             |
| ------------- | -------------------------------------------------- |
| Scrum Master  | Elizabeth Suescún (profesora)                      |
| Product Owner | Juan Camilo, Luis Miguel (Magneto)                 |
| Líder Técnico | Santiago Manco                                     |
| Integrante 1  | Pablo Manjarrés: team lead and development         |
| Integrante 2  | Valentina Barbosa: documentation and communication |

## Weights

Aspectos generales 5% · Sprint anterior 5% · Sprint actual 5% · Arquitectura 10% · Principios y
patrones 20% (exposición 10%, análisis 10%) · Funcionalidad y demostración 50% · Conclusiones 5%.

---

## 0. Requirements that apply to the whole delivery

- [ ] **Sustentación** on the date agreed with the PO; either member can be asked to present (Both)
- [ ] **Meeting with the Tech Lead and/or the PO through Teams.** Mandatory and graded (Both)
- [ ] **Replace every placeholder.** 23 lines with `{PENDIENTE}` are still in `Entrega3.md` (Both)
- [x] Product name, team and version on the cover (Pablo)
- [x] Table of contents covering every section (Pablo)
- [ ] Page numbers in the table of contents. Only applies once the markdown is exported (Valentina)
- [ ] State what each member contributed: Valentina's row is pending (Valentina)
- [ ] AI use justified and referenced with its prompts, as the Pacto Pedagógico requires (Both)

## 1. Aspectos generales

- [ ] Introducción: the problem, the solution, what was built and what the document contains
      (Valentina)

## 2. Evaluación del Sprint anterior

- [ ] Name the technique the retrospective was run under (Valentina)
- [ ] Improvement actions for what went wrong in sprint 2 (Valentina)
- [ ] Evidence of the retrospective (Valentina)
- [ ] Evidence of the meetings with the Tech Lead and the PO (Valentina)
- [ ] Daily or weekly evidence (Valentina)

## 3. Planificación del Sprint actual

- [x] What was built in sprint 3 and its impact on the architecture (Pablo)
- [ ] The sprint 3 stories on the board, with planning poker points (Both)
- [ ] Planning poker evidence (Valentina)
- [ ] Sprint backlog screenshot and link (Valentina)

## 4. Aspectos estructurales y arquitectónicos

- [x] Architecture described as a paragraph, with how the framework implements it (Pablo)
- [x] Summary table: type, styles, language, technical aspects, frameworks (Pablo)
- [ ] Implementation class diagram, drawn by the team: classes, attributes, methods, relations
      (Valentina)
- [x] What that diagram has to show, listed from the code (Pablo)
- [ ] Deployment diagram, updated: no Express service, Apify and the Claude API as external
      nodes (Valentina)
- [x] Persistence: the engine and why, and the tables with their keys (Pablo)
- [ ] Entity-relationship diagram updated with `application_events` (Valentina)

## 5. Principios de diseño (análisis en el proyecto, sin definiciones)

- [x] SOLID table, each principle pointed at the code (Pablo)
- [x] GRASP table, the nine patterns pointed at the code (Pablo)
- [x] Clean Code, with where it shows (Pablo)
- [ ] Both members can explain every row in the exposición (Both)

## 6. Patrones de diseño (mínimo 4, sin Singleton)

- [x] Observer: `ApplicationEvents`, the activity log (Pablo)
- [x] Strategy: `SORTS`, the vacancy list order (Pablo)
- [x] Repository: `packages/db/src/repositories/` (Pablo)
- [x] Facade: `apps/web/lib/queries.ts` and `client.ts` (Pablo)
- [x] State: `ALLOWED_MOVES` and `canMove` (Pablo)
- [x] Adapter: `mapLinkedInProfile` and the résumé reader into `ImportedProfile` (Pablo)
- [ ] A class diagram for each pattern's "Estructura" row, drawn by the team (Valentina)

## 7. Funcionalidad y demostración (50%)

- [x] Repository link (Pablo)
- [x] Directory tree and sample code for each layer (Pablo)
- [x] At least three user stories shown: profile and completeness, ranked vacancies, application
      board (Pablo)
- [x] A list from a database table with an action per record: `/applications` (Pablo)
- [x] A form launched from that list that inserts, updates or deletes: next step, withdraw, apply
      (Pablo)
- [x] No login in the demo: the app opens on the profile (Pablo)
- [x] Every screen restyled as a magneto365 page, in Spanish, Tailwind only (Pablo)
- [x] The 3D laptop in the profile wizard: click it and it opens and writes what you type; the
      dashboard shows it closed with the name and completeness (Pablo)
- [x] The activity log the brief asks for ("registro de actividades") (Pablo)
- [x] Import from LinkedIn (Apify) and from a PDF résumé (Claude), with review, edit and the source
      of every entry (#4 to #10) (Pablo)
- [x] Profile tailored to a vacancy, checked against the profile so nothing is invented (#31)
      (Pablo)
- [x] The résumé in Harvard format at `/cv`, ready to save as PDF (Pablo)
- [x] The tailored résumé next to the original with every change marked, side by side or
      changes only (#31) (Pablo)
- [x] Luna, an assistant button on every page: from a chat it edits the profile, tailors the
      résumé, finds vacancies and applies (Pablo)
- [x] Imports never duplicate: another person's import replaces the profile, the same person's
      completes it (#63) (Pablo)
- [x] Input validation, rate limiting and logs without personal data (#33, #34, #36) (Pablo)
- [ ] Sign-up and login (#3, #32): left out on purpose, login is not graded in this delivery
- [x] `pnpm lint`, `typecheck`, `test` (151 passing) and `build` green (Pablo)
- [ ] Screenshots of the screens (Valentina)
- [ ] Rehearse the demo end to end from `pnpm db:seed` (Both)

## Conclusiones y lecciones aprendidas

- [ ] Conclusions and lessons from sprint 3 (Valentina)

## Referencias

- [x] Books and sources behind sections 5 and 6 (Pablo)
- [ ] Other sources used during the sprint, in APA or IEEE (Valentina)
