# AGENTS.md — Repository Knowledge

## Project Overview

Astro personal website located in `treyturner.info-astro/`.

- Framework: Astro with MDX
- Package manager: npm
- Node: >=22.12.0

## Agent Working Rules

- Work only within the defined scope
- Do not modify unrelated files
- Prefer small, logically scoped commits
- Run required quality gates before claiming completion
- Keep completion messages focused on verifiable outcomes (tests, coverage, build status). Do not include runtime narration such as dev server restarts, HMR updates, or UI availability unless user action is required.
- To boostrap the environment:
  - Install dependencies with `npm ci`

## Quality Gates

Before claiming an iteration complete, run:

- `npm run lint`
- `npm run typecheck`
- `npm run test:coverage`
- `npm run build`
- `npm run test:e2e`

## In-Repo Reference Materials

Only as needed, additionally refer to:

- ARCHITECTURE.md
- DEPLOYMENT.md
