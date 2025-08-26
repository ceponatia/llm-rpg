import { describe, it, expect, beforeAll } from 'vitest';
import Fastify from 'fastify';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { setupStaticAdmin } from '../src/staticAdmin.js';

// We only test config endpoint behavior; static assets presence is not required here.

interface AdminBranding {
  productName: string;
  primaryColor: string;
  logoPath: string;
}

interface AdminFeatures { memoryInspector: boolean; betaFlag?: boolean; }
interface AdminApi { baseUrl: string; }
interface AdminAuth { public: boolean; gatedHtml: boolean; }
interface AdminBuild { version: string; timestamp: string; }

interface RuntimeConfigResponse {
  schemaVersion: number;
  branding: AdminBranding;
  features: AdminFeatures;
  api: AdminApi;
  auth: AdminAuth;
  build: AdminBuild;
  configVersion: string;
}

const isRuntimeConfig = (val: unknown): val is RuntimeConfigResponse => {
  if (val === null || typeof val !== 'object') { return false; }
  const v = val as Record<string, unknown>;
  return (
    typeof v.schemaVersion === 'number' &&
    typeof v.branding === 'object' && v.branding !== null &&
    typeof (v.branding as Record<string, unknown>).productName === 'string' &&
    typeof v.configVersion === 'string'
  );
};

describe('admin runtime config endpoint', () => {
  const fastify = Fastify({ logger: false });

  beforeAll(async () => {
    process.env.SERVE_ADMIN_STATIC = 'true';
    process.env.ADMIN_PUBLIC = 'true';
    // Create a temporary directory mimicking a built admin with index.html so static setup succeeds.
    const dir = mkdtempSync(join(tmpdir(), 'admin-dist-'));
    writeFileSync(join(dir, 'index.html'), '<!doctype html><html><head><title>Test</title></head><body><div id="root"></div></body></html>');
    process.env.ADMIN_STATIC_DIR = dir; // force this directory
    await setupStaticAdmin(fastify, { serve: true });
    await fastify.ready();
  });

  it('returns config json and etag', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/admin/config.json' });
    expect(res.statusCode).toBe(200);
    const etag = res.headers.etag;
  expect(typeof etag === 'string' && etag.length > 0).toBe(true);
  // Phase 3: version header present for observability
  expect(res.headers['x-admin-config-version']).toBeDefined();
    const bodyRaw: unknown = JSON.parse(res.body);
    expect(isRuntimeConfig(bodyRaw)).toBe(true);
    if (isRuntimeConfig(bodyRaw)) {
      expect(bodyRaw.branding.productName).toBeDefined();
      expect(bodyRaw.configVersion).toBeDefined();
    }
  });

  it('returns 304 when If-None-Match matches', async () => {
  const first = await fastify.inject({ method: 'GET', url: '/admin/config.json' });
  const etag = first.headers.etag as string;
  expect(typeof etag === 'string' && etag.length > 0).toBe(true);
  const second = await fastify.inject({ method: 'GET', url: '/admin/config.json', headers: { 'if-none-match': etag } });
    expect(second.statusCode).toBe(304);
  });
});
