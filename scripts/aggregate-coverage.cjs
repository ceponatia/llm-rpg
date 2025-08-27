#!/usr/bin/env node
/*
 * Aggregates lcov.info files from package coverage outputs into coverage/combined.lcov
 * No external deps; recursive directory scan.
 */
const { readdirSync, statSync, readFileSync, mkdirSync, writeFileSync } = require('fs');
const { join, resolve } = require('path');

const root = process.cwd();
const matches = [];

function scan(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let s; try { s = statSync(full); } catch { continue; }
    if (s.isDirectory()) {
      // Only descend into packages and their subdirs to limit scope
      if (full.includes('node_modules')) continue;
      scan(full);
    } else if (entry === 'lcov.info' && full.includes('/coverage/')) {
      matches.push(full);
    }
  }
}

scan(join(root, 'packages'));

if (!matches.length) {
  console.error('[coverage] No lcov.info files found. Run pnpm coverage first.');
  process.exit(1);
}

let combined = '';
for (const file of matches) {
  const content = readFileSync(file, 'utf8');
  const pkgRoot = file.split('/coverage/')[0];
  // Normalize each SF: line so Codacy can map files across packages uniquely.
  const normalized = content.replace(/^(SF:)(.+)$/gm, (m, p1, p2) => {
    // If already absolute or already namespaced with packages/, leave as-is.
    if (p2.startsWith('/') || p2.startsWith('packages/')) return m;
    // If relative (e.g. src/file.ts or postcss.config.js), prefix package path relative to repo root.
    // Determine repository-relative package root (after last occurrence of '/packages/')
    const idx = pkgRoot.lastIndexOf('/packages/');
    let relBase = pkgRoot;
    if (idx >= 0) relBase = pkgRoot.substring(idx + 1); // keep packages/...
    const cleanedBase = relBase.replace(/\\/g, '/');
    return `${p1}${cleanedBase}/${p2}`;
  });
  combined += normalized.endsWith('\n') ? normalized : normalized + '\n';
}

const outDir = resolve(root, 'coverage');
mkdirSync(outDir, { recursive: true });
const outFile = resolve(outDir, 'combined.lcov');
writeFileSync(outFile, combined, 'utf8');
console.log(`[coverage] Combined ${matches.length} lcov files into ${outFile}`);
