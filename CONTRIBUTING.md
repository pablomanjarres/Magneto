# Contributing

Two people, one repository, and a course that grades the process as well as the product. The
process below is the process the delivery document describes, so it is not optional.

## The loop

1. **Issue first.** No work without one. Use the templates in `.github/ISSUE_TEMPLATE/`:
   `user-story` for a story, `non-functional-story` for an `HU_NF`, `task` for everything else.
   A story carries its acceptance criteria before anyone writes code.
2. **One branch per issue**, cut from `main`: `feat/12-vacancy-detail`, `fix/31-seed-rerun`,
   `docs/8-architecture`. The number is the issue.
3. **Commit in the imperative, in English**, scoped to a package: `feat(core): weigh must-haves`.
   No `Co-Authored-By` trailers, on any commit, ever.
4. **Open a PR** against `main` and fill the template. Link the issue with `Closes #N`.
5. **The other member reviews it.** Nobody merges their own PR.
6. **Squash merge**, then the branch is deleted.

## Before you push

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm format:check
```

Plus `pnpm build` before you open the PR.

## What the repository will not accept

- **Secrets.** `.env` is gitignored. Document a new variable in `.env.example` with no real value.
- **JavaScript.** The repo is TypeScript, config files included. ESLint fails the build on a `.js`.
- **Spanish in the code.** Code, comments, docs, issues and commits are English. The graded
  documents are Spanish, because the course requires it. That is the only exception.
- **A second copy of anything.** If a piece of UI could appear on a second screen it is a
  component on the first one. Duplicated markup, styles or queries are treated as defects.
- **Generated delivery artefacts.** The template document, the sketches and the diagrams are made
  by hand. Generating them voids the work. See the hard rules in `CLAUDE.md`.

## Where things go

Domain rules go in `packages/core` and nowhere else. SQL lives only in `packages/db`. `apps/*` are
entrypoints, not second homes for logic.
