#!/usr/bin/env node
// Copies admin-dashboard/dist into backend/dist/admin (Option B)
import { cpSync, rmSync, existsSync, mkdirSync, statSync } from 'fs';
import { resolve } from 'path';

const adminDist = resolve('packages/admin-dashboard/dist');
const backendAdmin = resolve('packages/backend/dist/admin');

function log(msg){ console.log(`[embed-copy-admin] ${msg}`); }

try {
  if (!existsSync(adminDist) || !statSync(adminDist).isDirectory()) {
    throw new Error(`Admin dist not found at ${adminDist}. Run build first.`);
  }
  rmSync(backendAdmin, { recursive: true, force: true });
  mkdirSync(backendAdmin, { recursive: true });
  cpSync(adminDist, backendAdmin, { recursive: true });
  log(`Copied ${adminDist} -> ${backendAdmin}`);
  if (process.env.ADMIN_STATIC_DIR === './admin') {
    log('Runtime ADMIN_STATIC_DIR=./admin will serve copied assets.');
  }
} catch (e) {
  console.error('[embed-copy-admin] Failed:', (e instanceof Error ? e.message : e));
  process.exit(1);
}
