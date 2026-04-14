# PLAN.md

## Objective

Build a greenfield personal website for a Software Quality Architect / Staff SDET using Astro with TypeScript.

The site must be:

- statically generated
- content-driven using file-based collections
- fully tested with Vitest + Playwright
- coverage-enforced at 80% minimum
- CI-enforced from the first commit

## Core Stack

- Framework: Astro
- Language: TypeScript
- Runtime: Node >=22.12.0
- Package manager: npm
- Styling: plain CSS + CSS variables
- Content: MDX for blog/homelab, JSON for experience/recommendations
- Unit/integration tests: Vitest with coverage
- E2E tests: Playwright
- CI: GitHub Actions

## Required Pages

- Home
- Skills
- Work Experience
- Recommendations
- Homelab
- Blog index
- Blog detail
- RSS feed

## Git Workflow

- Never work directly on `main`
- Each iteration uses its own feature branch
- Each iteration ends with a PR against `main`
- Do not proceed to the next iteration until the prior PR is approved and merged

### Iteration branches

- `feature/iteration-1-foundation`
- `feature/iteration-2-content-pages`
- `feature/iteration-3-blog-system`
- `feature/iteration-4-homelab-polish`

## Quality Gates

At the end of every iteration, all of the following must pass:

- `npm run lint`
- `npm run typecheck`
- `npm run test:coverage`
- `npm run build`
- `npm run test:e2e`

Coverage must remain at or above 80% for:

- lines
- branches
- functions
- statements

Coverage must not regress relative to `main`.

## Iteration Overview

### Iteration 1 — Foundation

Scope:

- Astro scaffold
- Vitest + coverage
- Playwright
- coverage regression script
- ESLint
- base layout/styles
- Home page
- Resolve config gaps (vite.server.allowedHosts, CORS, WSS) and prove hot-reload (HMR) within OpenHands conversation view and dedicated browser tab
- GitHub Actions CI
  - External actions pinned by hash with corresponding version tag in a comment on the same line
  - Run all checks and tests
  - Publish HTML reports for vitest (allure), playwright, and coverage to self-hosted minio (s3 compatible) storage
  - Annotate run with clickable links to test reports
  - Pending success of the above, publish the site to GitHub Pages with the custom URL <https://astro.treyturner.info>

### Iteration 2 — Content Collections & Core Pages

Scope:

- content collection schemas
- sample content
- content utilities
- Skills page
- Work Experience page
- Recommendations page

### Iteration 3 — Blog System

Scope:

- BlogPostLayout
- blog index
- blog detail pages
- RSS feed

### Iteration 4 — Homelab, SEO, E2E Completeness

Scope:

- homelab index/detail
- SEO refinement
- navigation + broken link E2E
- final quality gate review
