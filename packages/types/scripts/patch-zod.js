#!/usr/bin/env node
/* global console */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const target = resolve(__dirname, '../src/zod/common.zod.ts');
try {
  let content = readFileSync(target, 'utf-8');
  // Replace incorrect single-arg z.record occurrences
  content = content.replace(/details:\s*z\.record\(z\.unknown\(\)\)/g, 'details: z.record(z.string(), z.unknown())');
  content = content.replace(/details:\s*z\.record\(z\.unknown\(\)\)\.optional\(\)/g, 'details: z.record(z.string(), z.unknown()).optional()');
  writeFileSync(target, content);
  console.log('[patch-zod] Patched common.zod.ts details record');
} catch (e) {
  console.error('[patch-zod] Failed to patch:', e);
}
