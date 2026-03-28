import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import type { HmrOptions } from 'vite';

const allowedHosts = ['localhost'];
if (process.env.ALLOWED_HOSTS) {
  allowedHosts.push(
    ...process.env.ALLOWED_HOSTS.split(',').map((h) => h.trim()).filter(Boolean),
  );
}

const corsOrigins = allowedHosts
  .filter((h) => h !== 'localhost')
  .map((h) => `https://${h}`);

let hmr: HmrOptions | undefined;
if (process.env.HMR_HOST) {
  hmr = {
    protocol: 'wss',
    host: process.env.HMR_HOST,
    clientPort: Number(process.env.HMR_PORT || 443),
    ...(process.env.HMR_PATH ? { path: process.env.HMR_PATH } : {}),
  };
}

export default defineConfig({
  integrations: [mdx()],
  site: 'https://treyturner.info',
  vite: {
    server: {
      allowedHosts,
      hmr,
      cors: corsOrigins.length ? { origin: corsOrigins } : undefined,
    },
  },
});
