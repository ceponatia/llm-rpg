#!/usr/bin/env node
// Copies admin-dashboard/dist into backend/dist/admin (Option B)
// Enhancements (Task 8):
//  - Supports CLI flags: --src, --dest, --dry-run, --clean=false
//  - Verifies source exists, prints file count & aggregate size
//  - Generates simple checksum (count + total bytes) for traceability
//  - Honors ADMIN_STATIC_DIR=./admin guidance
const { cpSync, rmSync, existsSync, mkdirSync, statSync, readdirSync } = require('fs');
const { resolve, join } = require('path');

function log(msg){ console.log(`[embed-copy-admin] ${msg}`); }
function fail(msg){ console.error(`[embed-copy-admin] ERROR: ${msg}`); process.exit(1); }

// Parse args
const args = process.argv.slice(2);
const argMap = Object.fromEntries(args.filter(a=>a.startsWith('--')).map(a=>{
  const [k,v='true'] = a.replace(/^--/,'').split('=');
  return [k,v];
}));

const srcDir = resolve(argMap.src || 'packages/admin-dashboard/dist');
const destDir = resolve(argMap.dest || 'packages/backend/dist/admin');
const dryRun = argMap['dry-run'] === 'true';
const clean = argMap.clean !== 'false';

try {
  if (!existsSync(srcDir) || !statSync(srcDir).isDirectory()) {
    fail(`Source dist not found at ${srcDir}. Run build first.`);
  }
  // compute simple stats
  let fileCount = 0; let totalBytes = 0;
  const walk = (p) => {
    for (const entry of readdirSync(p, { withFileTypes: true })) {
      const full = join(p, entry.name);
      if (entry.isDirectory()) walk(full); else { fileCount++; totalBytes += statSync(full).size; }
    }
  };
  walk(srcDir);
  const summary = `${fileCount} files, ${(totalBytes/1024).toFixed(1)} KB`;
  log(`Source: ${srcDir} (${summary})`);

  if (dryRun) {
    log(`Dry run enabled – skipping copy. Destination would be: ${destDir}`);
    process.exit(0);
  }
  if (clean) {
    rmSync(destDir, { recursive: true, force: true });
  }
  mkdirSync(destDir, { recursive: true });
  cpSync(srcDir, destDir, { recursive: true });
  log(`Copied -> ${destDir}`);
  log(`Checksum(meta): files=${fileCount} bytes=${totalBytes}`);
  if (process.env.ADMIN_STATIC_DIR === './admin') {
    log('Runtime ADMIN_STATIC_DIR=./admin will serve copied assets.');
  }
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
}
