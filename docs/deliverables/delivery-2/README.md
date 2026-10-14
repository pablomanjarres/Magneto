# Entrega 2 — 14 Oct 2026

Every item below is a requirement written in the course template, `Entrega2_Template_Arquitectura`.
Nothing here is invented and nothing the template asks for is missing. A box is ticked only when the
thing exists in this repository, not when it has been discussed.

- Backlog: https://github.com/pablomanjarres/Magneto/issues
- Board: https://github.com/users/pablomanjarres/projects/3 (view "Sprint Backlog #2")
- Document: [`document/Entrega2.md`](document/Entrega2.md)
- Spreadsheet: [`document/Entrega2_Template_HistoriasUsuario.xlsx`](document/Entrega2_Template_HistoriasUsuario.xlsx)

**Status: 38 of 51 done.** Verified against the repository on 2026-10-13.

## Roles

The same as in Entrega 1.

| Persona       | Nombre                                             |
| ------------- | -------------------------------------------------- |
| Scrum Master  | Elizabeth Suescún (profesora)                      |
| Product Owner | Juan Camilo, Luis Miguel (Magneto)                 |
| Líder Técnico | Santiago Manco                                     |
| Integrante 1  | Pablo Manjarrés: team lead and development         |
| Integrante 2  | Valentina Barbosa: documentation and communication |

## Sprint 2 — what gets built

The template expects at least 60% of the challenge. The board showed 13 of 34 stories closed (38%),
and an audit of the open stories against their acceptance criteria found only #13 already done, so
#13 is now closed (14 of 34). These close the rest of the gap with the least code:

| Story                                           | What is missing today                                                                         |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| #16 See how complete my profile is              | An empty profile reads 11%, not 0%, because "won't relocate" counts as answered               |
| #12 Set my target role                          | No area and no seniority                                                                      |
| #15 State whether I can relocate                | Relocation never moves the score                                                              |
| #18 Browse the available vacancies              | No paging: the list loads every vacancy at once                                               |
| #22 Compare a vacancy against my profile        | An empty profile gets a 0% breakdown instead of "complete your profile first"                 |
| #28 See a summary of the analysis               | The list rows lack the reason and the top three gaps                                          |
| #35 Secrets kept out of the repository          | Without `DATABASE_URL` the app falls back to a built-in connection string instead of stopping |
| #43 Write down the next step for an application | The board has no form that asks for data, which the demo below needs                          |

That is 22 of 35 stories closed, 63%. Sign-in and the other non-functional stories (#3, #32, #33, #34,
#36), the LinkedIn and résumé import (#4–#10) and the tailored profile (#31) stay for Entrega 3.

---

## 0. Requirements that apply to the whole delivery

From the first paragraph of the template.

- [ ] **Sustentación.** It is mandatory, and either member can be asked to present (Both)
- [x] **At least 60% of the challenge implemented.** The Sprint 2 stories above are merged: 22 of
      35 stories closed, 63% (Pablo)
- [x] **Justify the percentage in writing** and state that the team will keep working toward the
      objective (Pablo)
- [ ] **Replace every `[]` placeholder.** 7 lines with `{PENDIENTE}` are still in `Entrega2.md` (Both)
- [x] Product name, team and version on the cover (Pablo)
- [x] Table of contents covering the sections the template lists (Pablo)
- [ ] Page numbers in the table of contents, and a header on every page. Only applies once the
      markdown is exported to PDF (Valentina)
- [x] State what each member contributed (Valentina)

## 1. Historias de Usuario y Cono de la Incertidumbre (.xls)

The template ships its own spreadsheet. It is in [`document/`](document/), filled in Excel so its
charts keep working.

- [x] Fill the features against domain knowledge and technology knowledge: the open stories, with
      points from planning poker and their business uncertainty and technical complexity (Valentina)
- [x] Fill the Team Shape sheet with the roles above. Pablo is Project Manager, Architect, Senior
      Developer, Developer and Tester; Valentina is Business Analyst, Senior Tester and Developer
      (Valentina)
- [x] Write the analysis of the results the cone produces: which features landed in the zone of
      greatest uncertainty and what the team will do about it (Valentina)
- [x] Link the file and add the cone screenshot to the document (Valentina)

## 2. Aspectos generales de la entrega

- [x] Purpose stated: consensus among the team on the software architecture of Moonlight (Pablo)
- [x] The two fronts named: Vista Lógica and Vista Física (Pablo)

## 3. Evaluación del Sprint anterior

A retrospective of sprint 1. Only the evidence is missing.

- [x] Name the technique the retrospective was run under (Valentina)
- [x] List the improvement actions that fix the problems sprint 1 hit (Valentina)
- [x] Evidence of the ceremony: screenshot or photo (Valentina)

## 4. Planificación del Sprint actual

- [x] User stories listed with the impact each has on the architecture (Valentina)
- [x] Final sprint 2 selection, with the story points each one got (Valentina)
- [ ] Planning ceremony evidence, using planning poker to estimate (Valentina)
- [x] Daily or weekly evidence for the team (Valentina)
- [x] Evidence of the meeting with the PO and the Technical Lead, the assigned monitor (Valentina)
- [x] Sprint backlog link (Valentina)
- [x] Sprint backlog screenshot (Valentina)
- [x] Backlog changes reflected on the board: #13 closed, the stories done in sprint 1 moved out of
      Sprint 2, and the Sprint 2 stories above put in it (Valentina)
- [ ] The template says Azure and this team uses GitHub Projects: confirm with the monitor that this
      is accepted (Pablo)

## 5. Aspectos estructurales y arquitectónicos

The table is filled and the four diagrams are in. Diagrams are made by the team, never
AI-generated; they go in `docs/diagrams/` and their exports in `document/images/`.

### Estilos arquitectónicos usados

- [x] Tipo Aplicación (Pablo)
- [x] Estilo Arquitectónico, each one with its justification and its implications (Pablo)
- [x] Lenguaje de programación (Pablo)
- [x] Aspectos técnicos, including the type of database (Pablo)
- [x] Frameworks (Pablo)

### Vista Lógica — Diagrama de Clases de Diseño

- [x] Logical view described: packages, layers and the dependency rule (Pablo)
- [x] Design class diagram, drawn by the team (Valentina)

### Vista Lógica — Diagrama Entidad-Relación

- [x] Data model described: the tables, their keys and their constraints (Pablo)
- [x] Entity-relationship diagram, drawn by the team (Valentina)

### Vista Física — Diagrama de Componentes y Despliegue

- [x] Physical view described: processes, container and ports (Pablo)
- [x] Component diagram, with nodes and components and how they communicate (Valentina)
- [x] Deployment diagram, mapping the logical elements onto what actually runs (Valentina)

## 6. Avances en cuanto a funcionalidad y demostración

- [x] Repository URL where the code can be consulted (Pablo)
- [x] Directory tree of the project (Pablo)
- [x] Justification of how the proposed architecture was actually implemented (Pablo)
- [x] The screens and endpoints that already work. Verified: 7 pages, 9 route files serving 11
      handlers, and 78 domain tests passing (Pablo)
- [x] Screenshots of the functionality already developed (Valentina)
- [x] The percentage justification, same item as section 0 (Pablo)

### The demo the guide asks for

- [x] A list in the view with records coming from a database table (`/applications`, reading
      `applications`) and an action per record (move it to another column, or withdraw it) (Pablo)
- [x] A form launched from that list that asks the user for data and inserts, updates or deletes:
      "Edit next step" on each card updates, Withdraw deletes, Mark as applied inserts (Pablo)
- [ ] Rehearse the demo end to end, from a clean database (Both)
- [ ] Book the slot with the PO for the review (Both)

## Conclusiones y lecciones aprendidas

- [ ] Conclusions and lessons from sprint 2 (Valentina)

## Referencias

- [ ] Sources used to support the decisions taken, such as videos and tutorials, listed and
      described in the document (Valentina)
- [ ] AI tools used, with the prompts they were used with (Valentina)
