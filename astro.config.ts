import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import type { WsOptions } from 'vite';

const allowedHosts = ['localhost', '.coder.treyturner.info'];
if (process.env.ALLOWED_HOSTS) {
  allowedHosts.push(
    ...process.env.ALLOWED_HOSTS.split(',').map((h) => h.trim()).filter(Boolean),
  );
}

// Host patterns control which requests we serve, not cross-origin browser access.
const corsOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',').map((origin) => origin.trim()).filter(Boolean);

let ws: WsOptions | undefined;
if (process.env.WS_HOST) {
  ws = {
    protocol: 'wss',
    host: process.env.WS_HOST,
    clientPort: Number(process.env.WS_CLIENT_PORT || 443),
    ...(process.env.WS_PATH ? { path: process.env.WS_PATH } : {}),
  };
}

export default defineConfig({
  integrations: [mdx()],
  site: 'https://astro.treyturner.info',
  server: { allowedHosts },
  vite: {
    server: {
      ws,
      cors: corsOrigins.length ? { origin: corsOrigins } : undefined,
    },
  },
});
