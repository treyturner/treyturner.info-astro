# treyturner.info — Astro

Personal site built with [Astro](https://astro.build/). Deployed as a static site to GitHub Pages at [astro.treyturner.info](https://astro.treyturner.info).

## Stack

| Layer           | Tool                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------- |
| Framework       | [Astro](https://astro.build/) with the MDX integration                                   |
| Language        | TypeScript (strict)                                                                      |
| Styling         | Plain CSS with CSS variables; component-scoped in `.astro` files                         |
| Unit tests      | [Vitest](https://vitest.dev/) + [@vitest/coverage-v8](https://vitest.dev/guide/coverage) |
| E2E tests       | [Playwright](https://playwright.dev/) (Chromium)                                         |
| Test reporting  | [Allure](https://allurereport.org/) (CI only)                                            |
| Linting         | ESLint with `eslint-plugin-astro` and `@typescript-eslint`                               |
| Node            | >=24.16.0                                                                                |
| Package manager | npm                                                                                      |

## Configuration

[astro.config.ts](astro.config.ts) reads a few optional environment variables for remote / proxied development environments:

| Variable        | Purpose                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| `ALLOWED_HOSTS` | Comma-separated additional hosts; a leading dot allows the domain and its subdomains |
| `CORS_ORIGINS` | Optional comma-separated exact origins for cross-origin browser access, including scheme and any port; independent of `ALLOWED_HOSTS` |
| `WS_HOST`      | External hostname for Vite's secure WebSocket connection (`server.ws.host`) |
| `WS_CLIENT_PORT` | Browser-facing WebSocket port (`server.ws.clientPort`, default `443`); not the server's listening port |
| `WS_PATH`      | Optional WebSocket path (`server.ws.path`) |

WebSocket overrides take effect when `WS_HOST` is set. Existing workspace settings must rename `HMR_HOST`, `HMR_PORT`, and `HMR_PATH` to `WS_HOST`, `WS_CLIENT_PORT`, and `WS_PATH`, respectively; the old names are no longer read.

None of these are needed for local development or the Coder exposed-port URLs: `localhost`, `coder.treyturner.info`, and all subdomains of `coder.treyturner.info` are allowed by default. Other hostnames remain blocked. This applies to development and preview servers.

Same-origin Coder access does not require CORS configuration. With `CORS_ORIGINS` unset, Vite retains its default localhost-origin policy; hostname patterns are never converted to CORS origins. If a separate frontend needs cross-origin access, explicitly configure its full origin (for example, `CORS_ORIGINS=https://frontend.example.com`). A custom list replaces the defaults, so include any localhost origins that frontend also needs. Do not use `allowedHosts: true` or an unrestricted CORS policy.

## npm scripts

| Script                  | What it does                                                 |
| ----------------------- | ------------------------------------------------------------ |
| `npm run dev`           | Start the Astro dev server at `localhost:4321`               |
| `npm run build`         | Production build to `dist/`                                  |
| `npm run preview`       | Serve the `dist/` build locally                              |
| `npm run typecheck`     | Run `astro check` (TypeScript + Astro template types)        |
| `npm run lint`          | Run ESLint across the whole project                          |
| `npm run test`          | Run unit tests once (alias for `test:unit`)                  |
| `npm run test:unit`     | Run unit tests once with Vitest                              |
| `npm run test:coverage` | Run unit tests and emit coverage reports to `coverage/`      |
| `npm run test:e2e`      | Run Playwright E2E tests against a preview server            |
| `npm run verify`        | Full quality gate: lint → typecheck → coverage → build → E2E |

## Test strategy

### Unit tests — Vitest

Location: `tests/unit/` (and any `src/**/*.test.ts`)

Vitest covers schema validation, utility functions, SEO helpers, and data validation. The test suites are:

| Suite                     | What it covers                         |
| ------------------------- | -------------------------------------- |
| `schemas-blog`            | Blog collection Zod schema             |
| `schemas-experience`      | Experience collection schema           |
| `schemas-homelab`         | Homelab collection schema              |
| `schemas-recommendations` | Recommendations collection schema      |
| `schemas-skills`          | Skills data schema                     |
| `utils-content`           | Content utility helpers                |
| `utils-coverage`          | Coverage comparison / regression logic |
| `utils-seo`               | SEO metadata helpers                   |
| `utils-theme`             | Theme utility helpers                  |

**Coverage thresholds** (enforced by Vitest): 80% lines, branches, functions, and statements across all `src/**/*.ts` files. Astro templates, pages, and content config are excluded — meaningful coverage belongs on the imported logic.

**Run unit tests:**

```sh
npm run test:unit
```

**Run with coverage:**

```sh
npm run test:coverage
# HTML report: coverage/lcov-report/index.html
```

### E2E tests — Playwright

Location: `tests/e2e/`

Playwright runs against the production build via `npm run preview` (port `8012`) using Chromium only. The test suites are:

| Suite             | What it covers                    |
| ----------------- | --------------------------------- |
| `home`            | Home page rendering and content   |
| `navigation`      | Site-wide nav links and routing   |
| `blog`            | Blog listing and post rendering   |
| `homelab`         | Homelab section rendering         |
| `experience`      | Experience section rendering      |
| `recommendations` | Recommendations section rendering |
| `skills`          | Skills section rendering          |
| `rss`             | RSS feed structure and validity   |
| `theme`           | Light/dark theme toggle           |
| `broken-links`    | No broken internal links          |

**Run E2E tests** (builds and serves automatically if not already running):

```sh
npm run test:e2e
# HTML report: playwright-report/index.html
```

Playwright auto-starts the preview server when `reuseExistingServer` is false (CI). Locally it reuses an already-running preview server if available.

To check the running development server as well, set `PLAYWRIGHT_BASE_URL`:

```sh
PLAYWRIGHT_BASE_URL=http://localhost:4321 npm run test:e2e -- tests/e2e/projects.spec.ts
```

This override does not start or stop a server. It is useful for catching development-only content and image-cache problems that a fresh production build can miss.

### Coverage regression

`scripts/check-coverage-regression.mjs` compares the current branch's `coverage/coverage-summary.json` against the base branch's. In CI this runs automatically after unit tests on every pull request and fails the job if coverage regresses.

## CI workflow

[.github/workflows/ci.yml](.github/workflows/ci.yml) — single `CI` job, runs on every push to `main` and on pull requests targeting `main`.

Steps in order:

1. **Checkout** the repository
2. **Setup Node.js** from `.nvmrc` with npm cache
3. **Install dependencies** (`npm ci`)
4. **Lint** (`npm run lint`)
5. **Type check** (`npm run typecheck`)
6. **Unit tests with coverage** (`npm run test:coverage`)
7. **Build** (`npm run build`)
8. **Install Playwright browsers** (Chromium + system deps)
9. **E2E tests** (`npm run test:e2e`)
10. **Coverage regression check** — on PRs, builds base branch in a worktree and compares coverage summaries
11. **Allure report generation** (always, if results directory exists)
12. **Upload artifacts** (coverage report, Playwright report, Allure report — retained 7 days)
13. **S3 uploads** (MinIO-backed; skipped for Dependabot runs) — reports uploaded under `s3://test-reports/treyturner.info-astro/<timestamp>/`
14. **Job summary** with direct links to all three hosted reports

## Docs

| Document                                     | Contents                                                                          |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Site shape, content model, rendering model, styling rules, testing philosophy     |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)     | Hosting model, GitHub Pages setup, blue/green rollout plan, custom domain cutover |
| [docs/AGENTS.md](docs/AGENTS.md)             | Agent/AI working rules, quality gates, OpenHands hot reload bootstrap             |
