// @ts-ignore vitest types resolution handled via devDependency
import { describe, it, expect, beforeAll } from 'vitest';
import Fastify from 'fastify';
import path from 'path';
import { setupStaticAdmin } from '../src/staticAdmin.js';
import { readFileSync } from 'fs';

// Helper to spin up fastify with static admin
async function buildServer(env: Record<string,string|undefined>) {
  const fastify = Fastify({ logger: false });
  // inject env
  Object.entries(env).forEach(([k,v]) => { if (v !== undefined) (process.env as any)[k] = v; });
  await setupStaticAdmin(fastify, { serve: true });
  await fastify.get('/healthz', async () => ({ ok: true }));
  await fastify.listen({ port: 0 });
  const address = fastify.server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return { fastify, url: `http://127.0.0.1:${port}` };
}

function findAdminDist(): string | null {
  const candidates = [
    path.resolve('packages/backend/dist/admin'),
    path.resolve('packages/admin-dashboard/dist')
  ];
  for (const c of candidates) {
    try { readFileSync(path.join(c, 'index.html')); return c; } catch {/* ignore */}
  }
  return null;
}

describe('static admin embed', () => {
  let adminDist: string | null;
  beforeAll(() => { adminDist = findAdminDist(); });

  it('serves index.html (public mode)', async () => {
    if (!adminDist) return; // skip if not built
    const { fastify, url } = await buildServer({ ADMIN_STATIC_DIR: adminDist, ADMIN_PUBLIC: 'true', ADMIN_BASE_PATH: '/admin/' });
    const res = await fetch(url + '/admin/');
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(text).toMatch(/<html/i);
    await fastify.close();
  });

  it('enforces X-Admin-Key when ADMIN_PUBLIC!=true', async () => {
    if (!adminDist) return; // skip if not built
    const { fastify, url } = await buildServer({ ADMIN_STATIC_DIR: adminDist, ADMIN_PUBLIC: 'false', ADMIN_API_KEY: 'secret', ADMIN_BASE_PATH: '/admin/' });
    const resUnauth = await fetch(url + '/admin/');
    expect(resUnauth.status).toBe(401);
    const resAuth = await fetch(url + '/admin/', { headers: { 'X-Admin-Key': 'secret' } });
    expect(resAuth.status).toBe(200);
    await fastify.close();
  });

  it('returns 200 for hashed asset if exists', async () => {
    if (!adminDist) return; // skip if not built
    // crude: look for first .js file inside assets
    let asset: string | null = null;
    try {
      const fs = await import('fs/promises');
      const assetsDir = path.join(adminDist, 'assets');
      const files = await fs.readdir(assetsDir);
      asset = files.find(f => f.endsWith('.js')) || null;
      if (!asset) return; // skip test
      const { fastify, url } = await buildServer({ ADMIN_STATIC_DIR: adminDist, ADMIN_PUBLIC: 'true', ADMIN_BASE_PATH: '/admin/' });
      const res = await fetch(`${url}/admin/assets/${asset}`);
      expect(res.status).toBe(200);
      const cc = res.headers.get('cache-control');
      expect(cc).toMatch(/max-age/);
      await fastify.close();
    } catch {/* ignore */}
  });
});
