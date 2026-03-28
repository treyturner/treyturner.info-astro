import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

const allowedHosts = ['localhost'];
if (process.env.ALLOWED_HOSTS) {
  allowedHosts.push(
    ...process.env.ALLOWED_HOSTS.split(',').map((h) => h.trim()).filter(Boolean),
  );
}

export default defineConfig({
  integrations: [mdx()],
  site: 'https://treyturner.info',
  vite: {
    server: { allowedHosts },
  },
});
