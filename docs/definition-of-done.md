# Definition of done

An issue is closed when every line below is true. Not "mostly", not "the happy path works".

## Code

- [ ] The acceptance criteria on the issue are all met, not most of them
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` all pass locally
- [ ] Nothing is duplicated: a second copy of markup, a style block or a query is a bug
- [ ] Domain rules live in `packages/core`, not in a route handler or a page
- [ ] The empty state, the missing record and the failed request are all handled on screen

## Data

- [ ] A schema change ships as a new migration, re-runnable, never an edit to an old one
- [ ] The seed still runs twice in a row without duplicating anything

## Review

- [ ] One branch per issue, named after it, squash merged
- [ ] Reviewed by the other member. A PR is not merged by the person who wrote it
- [ ] CI green on the PR, not "green on my machine"
- [ ] No `Co-Authored-By` trailers, no secrets, no `.env` file in the diff

## Delivery artefacts

- [ ] The delivery checklist in `docs/deliverables/delivery-N/README.md` is ticked for the item
- [ ] Anything graded that was written by hand stays written by hand: the template document, the
      sketches in `docs/sketches/` and the diagrams in `docs/diagrams/`. Generating them voids
      the work — see the hard rules in the repository's `CLAUDE.md`
