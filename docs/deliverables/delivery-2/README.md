# Entrega 2 — checklist

Every item below is a requirement written in `Entrega2_Template_Arquitectura.pdf`. Nothing here is
invented and nothing the template asks for is missing. A box is ticked only when the thing exists in
this repository, not when it has been discussed.

- Backlog: https://github.com/pablomanjarres/Magneto/issues
- Board: https://github.com/users/pablomanjarres/projects/3
- Document: [`document/Entrega2.md`](document/Entrega2.md)

**Status: 20 of 51 done.** Verified against the repository on 2026-08-31.

---

## 0. Requirements that apply to the whole delivery

From the first paragraph of the template.

- [ ] **Sustentación.** It is mandatory. Nothing exists yet in `presentation/` or `video/`
- [ ] **At least 60% of the challenge implemented.** The board says 13 of 34 user stories are
      closed, which is 38%. This is the item that can fail the delivery
- [ ] **Audit the board before quoting any percentage.** #12, #13, #15, #16, #18, #22 and #28 are
      still open but look built: the onboarding wizard already captures target role, salary and
      relocation, and `/dashboard`, `/jobs` and `/jobs/[id]` are working screens. Verify each one
      and close what is done — that moves 13/34 to about 20/34, which is 59%
- [ ] **Justify the percentage in writing** and state that the team will keep working toward the
      objective. The template asks for this explicitly
- [ ] **Replace every `[]` placeholder.** 25 `{PENDIENTE}` markers are still in `Entrega2.md`
- [x] Product name, team and version on the cover
- [x] Table of contents covering the sections the template lists
- [ ] Page numbers in the table of contents, and a header on every page. Only applies once the
      markdown is exported to PDF
- [ ] State what each member contributed

## 1. Historias de Usuario y Cono de la Incertidumbre (.xls)

The template ships its own spreadsheet, `Entrega2_Template_HistoriasUsuario.xlsx`. It is not in the
repository yet.

- [ ] Fill the features against domain knowledge and technology knowledge
- [ ] Write the analysis of the results the cone produces — which features landed in the zone of
      greatest uncertainty and what the team will do about it
- [ ] Link the file and add the screenshot to the document

## 2. Aspectos generales de la entrega

- [x] Purpose stated: consensus among the team on the software architecture of Moonlight
- [x] The two fronts named: Vista Lógica and Vista Física

## 3. Evaluación del Sprint anterior

A retrospective of sprint 1. All three items are empty.

- [ ] Name the technique the retrospective was run under
- [ ] List the improvement actions that fix the problems sprint 1 hit
- [ ] Evidence of the ceremony — screenshot or photo

## 4. Planificación del Sprint actual

- [x] User stories listed with the impact each has on the architecture
- [ ] Final sprint 2 selection, with the story points each one got
- [ ] Planning ceremony evidence, using planning poker to estimate
- [ ] Daily or weekly evidence for the team
- [ ] Evidence of the meeting with the PO and the Technical Lead, the assigned monitor
- [x] Sprint backlog link
- [ ] Sprint backlog screenshot
- [ ] Backlog changes reflected on the board. The template says Azure and this team uses GitHub
      Projects — confirm with the monitor that this is accepted

## 5. Aspectos estructurales y arquitectónicos

The table is filled. The four diagrams are not. Diagrams are made by the team, never AI-generated;
they go in `docs/diagrams/` and their exports in `document/images/`.

### Estilos arquitectónicos usados

- [x] Tipo Aplicación
- [x] Estilo Arquitectónico, each one with its justification and its implications
- [x] Lenguaje de programación
- [x] Aspectos técnicos, including the type of database
- [x] Frameworks

### Vista Lógica — Diagrama de Clases de Diseño

- [x] Logical view described: packages, layers and the dependency rule
- [ ] Design class diagram, drawn by the team

### Vista Lógica — Diagrama Entidad-Relación

- [x] Data model described: the tables, their keys and their constraints
- [ ] Entity-relationship diagram, drawn by the team

### Vista Física — Diagrama de Componentes y Despliegue

- [x] Physical view described: processes, container and ports
- [ ] Component diagram, with nodes and components and how they communicate
- [ ] Deployment diagram, mapping the logical elements onto what actually runs

## 6. Avances en cuanto a funcionalidad y demostración

- [x] Repository URL where the code can be consulted
- [x] Directory tree of the project
- [x] Justification of how the proposed architecture was actually implemented
- [x] The screens and endpoints that already work. Verified: 7 pages, 9 route files serving 11
      handlers, and 45 domain tests passing
- [ ] Screenshots of the functionality already developed
- [ ] The percentage justification, same item as section 0
- [ ] Video for the sustentación

### The demo the guide asks for

The code exists for both. What is missing is rehearsing it and showing it live.

- [x] A list in the view with records coming from a database table (`/jobs`, reading `vacancies`)
      and an action per record (open the detail, then Apply)
- [x] A form launched from that list that manipulates data. `/onboarding` inserts and updates
      through the upsert in `POST /api/profiles`; `/applications` deletes through `DELETE` and
      moves status through `PATCH`
- [ ] Rehearse the demo end to end, from a clean database
- [ ] Book the slot with the PO for the review

## Conclusiones y lecciones aprendidas

- [ ] Conclusions and lessons from sprint 2

## Referencias

- [ ] Sources used to support the decisions taken — videos, tutorials — listed and described
      in the document
- [ ] AI tools used, with the prompts they were used with
