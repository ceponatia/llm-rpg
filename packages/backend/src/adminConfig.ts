import crypto from 'node:crypto';

export interface AdminRuntimeConfig {
  schemaVersion: 1;
  branding: {
    productName: string;
    primaryColor: string;
    logoPath: string;
    extra?: Record<string, unknown>;
  };
  features: {
    memoryInspector: boolean;
    betaFlag: boolean;
  };
  api: { baseUrl: string };
  auth: { public: boolean; gatedHtml: boolean };
  build: { version: string; timestamp: string };
  configVersion: string;
}

export interface BuiltAdminRuntimeConfig {
  config: AdminRuntimeConfig;
  json: string;
  etag: string; // weak etag value without W/ prefix
  hash: string; // raw sha256 hex (short)
}

function shortHash(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 12);
}

export function buildAdminRuntimeConfig(basePath: string): BuiltAdminRuntimeConfig {
  const productName = process.env.ADMIN_PRODUCT_NAME ?? 'RPG Control';
  const primaryColor = process.env.ADMIN_PRIMARY_COLOR ?? '#6d28d9';
  const logoPath = process.env.ADMIN_LOGO_PATH ?? `${basePath}assets/logo.svg`;
  const version = process.env.GIT_SHA ?? process.env.BUILD_VERSION ?? 'dev';
  const timestamp = process.env.BUILD_TIME ?? new Date().toISOString();

  const config: AdminRuntimeConfig = {
    schemaVersion: 1,
    branding: { productName, primaryColor, logoPath },
    features: {
      memoryInspector: process.env.FEAT_MEMORY_INSPECTOR === 'true',
      betaFlag: process.env.FEAT_BETA_FLAG === 'true'
    },
  api: { baseUrl: process.env.ADMIN_API_BASE ?? '/api' },
    auth: {
      public: process.env.ADMIN_PUBLIC === 'true',
      gatedHtml: process.env.ADMIN_PUBLIC !== 'true'
    },
    build: { version, timestamp },
    configVersion: 'v1'
  };

  const json = JSON.stringify(config);
  const hash = shortHash(json);
  config.configVersion = hash; // set after hash so version == content signature
  const finalJson = JSON.stringify(config);
  const etag = hash; // We'll add weak prefix when sending

  return { config, json: finalJson, etag, hash };
}
