import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadRuntimeConfig, getRuntimeConfig } from './runtime';

// Provide minimal DOM / document for tests (vitest jsdom environment assumed; if not, these guards help)
// @ts-ignore
if (typeof document === 'undefined') {
  // noop fallback; tests that depend on DOM will skip
}

beforeEach(() => {
  (global as unknown).fetch = undefined;
  if ((global as unknown).__resetRuntimeConfig) {(global as unknown).__resetRuntimeConfig();}
});

describe('runtime config loader', () => {
  it('falls back when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })) as unknown);
    const cfg = await loadRuntimeConfig(1);
    expect(cfg.configVersion).toBe('fallback');
    expect(getRuntimeConfig().branding.productName).toBe(cfg.branding.productName);
  });

  it('loads config when fetch succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({
      schemaVersion: 1,
      branding: { productName: 'Custom', primaryColor: '#123456', logoPath: '/x.svg' },
      features: { memoryInspector: true, betaFlag: false },
      api: { baseUrl: '/api' },
      auth: { public: true, gatedHtml: false },
      build: { version: 'v', timestamp: new Date().toISOString() },
      configVersion: 'abc'
    }) })) as unknown);
  const cfg = await loadRuntimeConfig(0);
    expect(cfg.branding.productName).toBe('Custom');
    expect(cfg.features.memoryInspector).toBe(true);
  });
});