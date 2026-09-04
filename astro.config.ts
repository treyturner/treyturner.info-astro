import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import type { WsOptions } from 'vite';

const allowedHosts = ['localhost'];
if (process.env.ALLOWED_HOSTS) {
  allowedHosts.push(
    ...process.env.ALLOWED_HOSTS.split(',').map((h) => h.trim()).filter(Boolean),
  );
}

const corsOrigins = allowedHosts
  .filter((h) => h !== 'localhost')
  .map((h) => `https://${h}`);

let ws: WsOptions | undefined;
if (process.env.HMR_HOST) {
  ws = {
    protocol: 'wss',
    host: process.env.HMR_HOST,
    clientPort: Number(process.env.HMR_PORT || 443),
    ...(process.env.HMR_PATH ? { path: process.env.HMR_PATH } : {}),
  };
}

export default defineConfig({
  integrations: [mdx()],
  site: 'https://astro.treyturner.info',
  vite: {
    server: {
      allowedHosts,
      ws,
      cors: corsOrigins.length ? { origin: corsOrigins } : undefined,
    },
  },
});
