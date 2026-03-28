# AGENTS.md — Repository Knowledge

## Project Overview

Astro personal website located in `treyturner.info-astro/`.

- Framework: Astro (latest) with MDX
- Package manager: npm
- Node: >=22.12.0

---

## OpenHands Hot Reload Bootstrap

This repository is commonly developed inside OpenHands using the App tab with hot reload.

To enable this, the Astro dev server must be started in the background and configured to work through the OpenHands reverse proxy.

---

## External Host Model (Critical)

OpenHands exposes container ports using the pattern:

    https://{port}.openhands.treyturner.info

Example:

- Dev server runs on container port `8011`
- It is exposed as:

    <https://8011.openhands.treyturner.info>

We refer to this as:

    <work-host> = {port}.openhands.treyturner.info

This value must be used consistently for host validation, CORS, and HMR.

---

## Required Configuration Invariants

These must all be true for hot reload to work:

### 1. Dev server binding

    --host 0.0.0.0 --port 8011

- Required so the reverse proxy can reach the server

---

### 2. Allowed hosts (Vite security)

    ALLOWED_HOSTS = <work-host>,openhands.treyturner.info

Why:

- `<work-host>` serves the app
- `openhands.treyturner.info` is the App tab origin (iframe)

Both must be allowed or requests will be blocked.

---

### 3. HMR configuration (critical)

    HMR_HOST = <work-host>
    HMR_PORT = 443

Why:

- Browser connects via HTTPS → must use WSS (port 443)
- Must use the externally routable hostname, not localhost

---

### 4. CORS behavior

- CORS origins should be derived from `ALLOWED_HOSTS`
- Prefix with `https://`
- Do NOT use wildcard (`*`)

---

## Startup Pattern (Known Good)

Start the dev server in the background so the agent can continue working while hot reload updates the UI.

    nohup env \
      ALLOWED_HOSTS="<work-host>,openhands.treyturner.info" \
      HMR_HOST="<work-host>" \
      HMR_PORT=443 \
      npx astro dev --host 0.0.0.0 --port 8011 > /tmp/astro-dev.log 2>&1 &

---

## Determining `<work-host>`

- `<work-host>` corresponds to the externally exposed port
- Format: `<port>.openhands.treyturner.info`

---

## Notes

- This setup is **environment-specific to OpenHands**
- It is not required for local development
- This is operational guidance for agents, not application logic
