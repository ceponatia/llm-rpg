import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { buildAdminRuntimeConfig } from '../adminConfig.js';
import { logger } from '@rpg/utils';

// Simple CLI to emit current admin runtime config snapshot to a file (default stdout).
// Usage: pnpm -F @rpg/backend write:admin-config [outputPath]

function main(): void {
  const baseRaw = process.env.ADMIN_BASE_PATH;
  const basePath = (typeof baseRaw === 'string' && baseRaw !== '') ? (baseRaw.endsWith('/') ? baseRaw : baseRaw + '/') : '/admin/';
  const built = buildAdminRuntimeConfig(basePath);
  const outArg = process.argv[2];
  if (typeof outArg === 'string' && outArg !== '') {
    const dest = resolve(process.cwd(), outArg);
    const dir = dest.substring(0, dest.lastIndexOf('/'));
    if (dir !== '') {
      try { mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }
    }
    writeFileSync(dest, `${built.json}\n`);
    logger.info(`[admin-config] wrote snapshot -> ${dest} (version=${built.config.configVersion})`);
  } else {
    // write raw JSON to stdout without triggering no-console
    process.stdout.write(`${built.json}\n`);
  }
  logger.info(`[admin-config] hash=${built.hash} version=${built.config.configVersion}`);
}

try {
  main();
} catch (err: unknown) {
  logger.error('[admin-config] failed', err);
  process.exit(1);
}
