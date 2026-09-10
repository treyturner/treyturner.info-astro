import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { get, type IncomingMessage } from 'node:http';
import { createServer } from 'vite';
import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadConfig(overrides: Record<string, string> = {}) {
  for (const [key, value] of Object.entries({
    ALLOWED_HOSTS: '', CORS_ORIGINS: '', WS_HOST: '', WS_CLIENT_PORT: '', WS_PATH: '',
    HMR_HOST: '', HMR_PORT: '', HMR_PATH: '',
    __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS: '', ...overrides,
  })) vi.stubEnv(key, value);
  vi.resetModules();
  return (await import('../../astro.config')).default;
}

afterEach(() => { vi.unstubAllEnvs(); });

describe('development server configuration', () => {
  it('allows the trusted Coder domain without broadening CORS', async () => {
    const config = await loadConfig();
    expect(config.server).toEqual({ allowedHosts: ['localhost', '.coder.treyturner.info'] });
    expect(config.vite?.server?.cors).toBeUndefined();
    expect(config.vite?.server?.ws).toBeUndefined();
  });

  it('keeps additional host patterns independent of exact CORS origins', async () => {
    const config = await loadConfig({
      ALLOWED_HOSTS: ' staging.example.com, , .workspace.example.com ',
      CORS_ORIGINS: ' https://frontend.example.com, , http://localhost:3000 ',
    });
    expect(config.server).toEqual({ allowedHosts: [
      'localhost', '.coder.treyturner.info', 'staging.example.com', '.workspace.example.com',
    ] });
    expect(config.vite?.server?.cors).toEqual({ origin: ['https://frontend.example.com', 'http://localhost:3000'] });
  });

  it('uses WS variables for default and custom WebSocket proxy settings', async () => {
    const defaults = await loadConfig({ WS_HOST: 'dev.example.com' });
    expect(defaults.vite?.server?.ws).toEqual({ protocol: 'wss', host: 'dev.example.com', clientPort: 443 });
    const custom = await loadConfig({ WS_HOST: 'dev.example.com', WS_CLIENT_PORT: '8443', WS_PATH: '/ws' });
    expect(custom.vite?.server?.ws).toEqual({ protocol: 'wss', host: 'dev.example.com', clientPort: 8443, path: '/ws' });
  });

  it('does not fall back to legacy HMR variables', async () => {
    const legacy = { HMR_HOST: 'legacy.example.com', HMR_PORT: '8443', HMR_PATH: '/legacy' };
    const ignored = await loadConfig(legacy);
    expect(ignored.vite?.server?.ws).toBeUndefined();
    const current = await loadConfig({ ...legacy, WS_HOST: 'dev.example.com' });
    expect(current.vite?.server?.ws).toEqual({ protocol: 'wss', host: 'dev.example.com', clientPort: 443 });
  });

  it('enforces domain boundaries through the actual Vite HTTP middleware', async () => {
    const config = await loadConfig();
    const directory = await mkdtemp(join(tmpdir(), 'coder-host-test-'));
    const server = await createServer({
      configFile: false, envFile: false, root: directory, logLevel: 'silent',
      server: {
        allowedHosts: (config.server as { allowedHosts: string[] }).allowedHosts,
        cors: config.vite?.server?.cors, host: '127.0.0.1', port: 0, ws: false, watch: null,
      },
      plugins: [{ name: 'test-response', configureServer(server) {
        return () => { server.middlewares.use((_request, response) => { response.end('ok'); }); };
      } }],
    });
    try {
      await server.listen();
      const { port } = server.httpServer!.address() as AddressInfo;
      const url = `http://127.0.0.1:${port}/`;
      // Node's fetch does not preserve a custom Host header; send real proxy-style requests.
      const request = (headers: Record<string, string>) => new Promise<IncomingMessage>((resolve, reject) => {
        get(url, { headers }, (response) => {
          response.resume();
          response.on('end', () => resolve(response));
          response.on('error', reject);
        }).on('error', reject);
      });
      for (const host of ['localhost', 'coder.treyturner.info', '4321--main--dev--treyturner.coder.treyturner.info', 'nested.workspace.coder.treyturner.info']) {
        const response = await request({ host });
        expect(response.statusCode, host).toBe(200);
      }
      for (const host of ['example.com', 'treyturner.info', 'evilcoder.treyturner.info', 'coder.treyturner.info.evil.example']) {
        const response = await request({ host });
        expect(response.statusCode, host).toBe(403);
      }
      const remote = await request({ host: 'workspace.coder.treyturner.info', origin: 'https://untrusted.example' });
      expect(remote.headers['access-control-allow-origin']).toBeUndefined();
      const local = await request({ origin: 'http://localhost:3000' });
      expect(local.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    } finally {
      await server.close();
      await rm(directory, { recursive: true, force: true });
    }
  });
});
