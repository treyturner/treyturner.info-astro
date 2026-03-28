# AGENTS.md — Repository Knowledge

## Project Overview

Astro personal website located in `treyturner.info-astro/`.

- Framework: Astro with MDX
- Package manager: npm
- Node: >=22.12.0

## Agent Working Rules

- Work only within the currently assigned iteration
- Do not begin the next iteration unless explicitly instructed
- Do not modify unrelated files
- Prefer small, logically scoped commits
- Run required quality gates before claiming completion
- When beginning a new conversation:
  - Install dependencies with `npm ci`
  - Follow the Hot Reload Bootstrap below so that the application is visible in the in-conversation app browser.

## OpenHands Hot Reload Bootstrap

This repository is commonly developed inside OpenHands using the App tab with hot reload.

To enable this, the Astro dev server must be started in the background and configured to work through the OpenHands reverse proxy.

## External Host Model (Critical)

OpenHands exposes sandbox services using a public host derived from the externally assigned sandbox port, not the container's internal port.

- Astro dev server listens internally on `0.0.0.0:8011`
- OpenHands maps that to an external URL such as:

    <https://33053.openhands.treyturner.info>

We refer to this externally routable hostname as:

    <work-host> = <external-port>.openhands.treyturner.info

This value must be used for:

- `ALLOWED_HOSTS`
- `HMR_HOST`
- derived CORS origins

## Required Configuration Invariants

### 1. Dev server binding

    --host 0.0.0.0 --port 8011

### 2. Allowed hosts (Vite security)

    ALLOWED_HOSTS = <work-host>,openhands.treyturner.info

Both hosts must be allowed:

- `<work-host>` serves the app
- `openhands.treyturner.info` is the App tab origin

Both must be allowed or requests will be blocked.

### 3. HMR configuration

    HMR_HOST = <work-host>
    HMR_PORT = 443

HMR must use the externally routable host over WSS, not localhost.

### 4. CORS behavior

- derive allowed origins from `ALLOWED_HOSTS`
- prefix with `https://`
- do not use wildcard `*`

## Startup Pattern (Known Good)

    nohup env \
      ALLOWED_HOSTS="<work-host>,openhands.treyturner.info" \
      HMR_HOST="<work-host>" \
      HMR_PORT=443 \
      npx astro dev --host 0.0.0.0 --port 8011 > /tmp/astro-dev.log 2>&1 &

## Quality Gates

Before claiming an iteration complete, run:

- `npm run lint`
- `npm run typecheck`
- `npm run test:coverage`
- `npm run build`
- `npm run test:e2e`
