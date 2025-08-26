import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadRuntimeConfig, getRuntimeConfig } from './runtime';

// Provide minimal DOM / document for tests (vitest jsdom environment assumed; if not, these guards help)
// Guard for non-jsdom environments
if (typeof document === 'undefined') {
  // noop fallback; tests that depend on DOM will skip
}

declare global {
  // Augment test global with optional runtime reset hook
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Global {
    __resetRuntimeConfig?: () => void;
  }
}

beforeEach((): void => {
  const g = globalThis as Global & { fetch?: unknown };
  g.fetch = undefined;
  const maybeReset = g.__resetRuntimeConfig;
  if (typeof maybeReset === 'function') {
    maybeReset();
  }
});

describe('runtime config loader', () => {
  it('falls back when fetch fails', async (): Promise<void> => {
  vi.stubGlobal('fetch', vi.fn(() => ({ ok: false })) as unknown);
    const cfg = await loadRuntimeConfig(1);
    expect(cfg.configVersion).toBe('fallback');
    expect(getRuntimeConfig().branding.productName).toBe(cfg.branding.productName);
  });

  it('loads config when fetch succeeds', async (): Promise<void> => {
  vi.stubGlobal('fetch', vi.fn(() => ({ ok: true, json: () => ({
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