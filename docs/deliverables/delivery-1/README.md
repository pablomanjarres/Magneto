# Entrega 1 — 19 Aug 2026

- Backlog: https://github.com/pablomanjarres/Magneto/issues
- Board: https://github.com/users/pablomanjarres/projects/3

## Document

- [x] Product name: Moon Light
- [ ] Header on every page: name, logo, members, v1.0 (Valentina)
- [ ] Remove template placeholders and highlights (Valentina)
- [ ] Update the table of contents (Valentina)
- [ ] State each member's contribution (Valentina)

## 1 Generalidades

- [x] 1.1 Problem and solution (Valentina)
- [x] 1.2 People and roles table (Valentina)
- [x] 1.3 Context diagram, by hand (Pablo)
- [ ] 1.4 Interaction process, candidate and admin (Pablo)

## 2 Antecedentes

- [x] Three similar apps with URL and screenshots (Valentina)
- [x] Our differentiator (Valentina)

## 3 Artefactos ágiles

- [ ] 3.1 Weekly ceremonies in Teams (Pablo)
- [x] 3.1 Meeting with the PO or the Technical Lead (Pablo)
- [x] 3.2 Vision and story mapping, with screenshot (Valentina)
- [x] 3.3 Backlog on GitHub, 34 stories, minimum was 20 (Pablo)
- [x] 3.3 Non-functional stories marked HU_NF, 5 of them (Pablo)
- [x] 3.4 Sprint backlog with criteria, owner and tasks (Valentina)

## 4 Sketches

By hand or Balsamiq. No AI. They go in `docs/sketches/`.

- [ ] Onboarding wizard steps (Valentina)
- [ ] Dashboard with the completeness bar (Valentina)
- [ ] Vacancy list ordered by score (Valentina)
- [ ] Vacancy detail with the recommendation explained (Valentina)
- [ ] Status board (Valentina)

## Sprint 1 scope: the candidate registers, nothing is imported

The brief's idea 1 starts from a LinkedIn scrape. **Sprint 1 does not do that.** A candidate
creates their own account and fills their profile by hand in the wizard, and the completeness bar
is what tells them how far along they are.

The reason is that the value of the product is the scoring and the explained ranking, and those
need a profile, not a particular way of obtaining one. Typing it is a way of obtaining one. The
import is release 2, and it pre-fills the very wizard the candidate already confirms today, so
nothing built here gets thrown away when it lands.

There is **no sign-in** either. Registering writes the new profile's id into a cookie so the app
knows whose profile to draw, and nothing is verified. Authentication is HU_NF #32 and stays open.

Backlog consequences, already applied on GitHub:

| Story                              | Was                    | Now                                           |
| ---------------------------------- | ---------------------- | --------------------------------------------- |
| #3 Sign up and log in              | release 1, not started | still open: registration only, no sign-in     |
| #4 Submit my LinkedIn profile URL  | release 1              | release 2                                     |
| #5 Extract my work experience      | release 1              | release 2                                     |
| #6 Extract my education            | release 1              | release 2                                     |
| #7 Extract my skills               | release 1              | release 2                                     |
| #8 Upload my résumé                | release 1              | release 2                                     |
| #9 Review the imported information | release 1              | release 2, needs provenance the import brings |
| #10 Edit the imported information  | release 1              | release 2, same reason                        |

Each of those issues carries the decision in its body, so the board and the document agree.

## 5 PoC y MVP

- [x] Environment PoC: Next.js, an endpoint, PostgreSQL seeded (Pablo)
- [x] Comparison PoC: Next API routes vs Express, recorded as an ADR (Pablo)
- [x] Seeded vacancy dataset, 20 vacancies (Valentina)
- [ ] MVP: profile in, scored, ordered list out (Pablo)
- [ ] Video, 5 minutes, showing JSON and database rows (Valentina)

### What runs, for the video

Start it with `pnpm db:up && pnpm db:migrate && pnpm db:seed && pnpm dev`, then walk these:

| Screen         | Route           | What to show                                                     |
| -------------- | --------------- | ---------------------------------------------------------------- |
| Register       | `/register`     | a name and an email, landing in the wizard with an empty profile |
| Onboarding     | `/onboarding`   | the bar moving as fields are filled                              |
| Dashboard      | `/dashboard`    | completeness, top matches, the gaps measured across all 20       |
| Vacancies      | `/jobs`         | 20 scored and ordered, filters                                   |
| Vacancy detail | `/jobs/v003`    | the weight table and 10 ÷ 11 = 91%                               |
| Status board   | `/applications` | moving an application between columns                            |

For the JSON and the rows the brief asks for:

```bash
pnpm smoke http://localhost:3000/api    # the whole flow, checked, against the real database
curl localhost:3000/api/profiles/demo-candidate/recommendations
psql -h localhost -p 5433 -U moonlight -d moonlight -c 'table applications'
```

## 6 Referencias

- [ ] Sources used (Valentina)
- [x] AI tools with their prompts (Valentina)
