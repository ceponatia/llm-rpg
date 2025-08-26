// Runtime configuration loader for admin dashboard (Phase 2)
export interface BrandingConfig {
  productName: string;
  primaryColor: string;
  logoPath: string;
  extra?: Record<string, unknown>;
}

export interface RuntimeConfig {
  schemaVersion: number;
  branding: BrandingConfig;
  features: {
    memoryInspector: boolean;
    betaFlag: boolean;
    [k: string]: boolean;
  };
  api: { baseUrl: string };
  auth: { public: boolean; gatedHtml: boolean };
  build: { version: string; timestamp: string };
  configVersion: string;
}

const FALLBACK_CONFIG: RuntimeConfig = {
  schemaVersion: 1,
  branding: {
    productName: 'RPG Control',
    primaryColor: '#6d28d9',
    logoPath: '/admin/assets/logo.svg'
  },
  features: { memoryInspector: false, betaFlag: false },
  api: { baseUrl: '/api' },
  auth: { public: true, gatedHtml: false },
  build: { version: 'dev', timestamp: new Date().toISOString() },
  configVersion: 'fallback'
};

let cached: RuntimeConfig | null = null;

export async function loadRuntimeConfig(retries = 3): Promise<RuntimeConfig> {
  if (cached !== null) { return cached; }
  const win: unknown = typeof window !== 'undefined' ? window : undefined;
  // Use nullish coalescing so empty string is respected if intentionally provided
  const url = (win as { __ADMIN_CONFIG_URL__?: string } | undefined)?.__ADMIN_CONFIG_URL__ ?? '/admin/config.json';
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {throw new Error('Non-200 response');}
      const data = (await res.json()) as RuntimeConfig;
      cached = data;
      applyBranding(data.branding);
      return data;
    } catch (err) {
      if (attempt === retries) {
        console.warn('[runtime-config] using fallback after attempts', err);
        cached = FALLBACK_CONFIG;
        applyBranding(FALLBACK_CONFIG.branding);
        return FALLBACK_CONFIG;
      }
      await new Promise(r => setTimeout(r, Math.min(1000 * 2 ** attempt, 5000)));
    }
  }
  return FALLBACK_CONFIG; // safeguard
}

function applyBranding(branding: BrandingConfig): void {
  if (typeof document === 'undefined') {return;} // SSR / test without DOM
  const root = document.documentElement;
  if (branding.primaryColor !== '') {
    root.style.setProperty('--color-primary', branding.primaryColor);
  }
  if (branding.productName !== '') {
    try { document.title = branding.productName; } catch { /* ignore */ }
  }
}

// Test-only helper (tree-shaken in prod) – accessed via (globalThis as GlobalRuntimeTest).__resetRuntimeConfig?.()
// We intentionally don't export to avoid public API.
interface GlobalRuntimeTest { __resetRuntimeConfig?: () => void }
;(globalThis as GlobalRuntimeTest).__resetRuntimeConfig = () => { cached = null; };

export function getRuntimeConfig(): RuntimeConfig {
  return cached ?? FALLBACK_CONFIG;
}
