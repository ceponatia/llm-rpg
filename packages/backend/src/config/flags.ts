import { z } from 'zod';

// Centralized environment flag & optional configuration parsing for backend runtime.
// Distinct from structured config in config.ts (which covers required core settings).
// This module focuses on optional feature toggles and operational tuning knobs.

// Raw environment snapshot (allow test overrides by reading process.env at import time)
const env = process.env;

// Schema: keep all optional with sensible coercion so unknown vars are ignored gracefully.
const flagsSchema = z.object({
  // For boolean flags: return undefined when env var absent so downstream default logic applies
  CHAT_ECHO_MODE: z.string().optional().transform(v => v === undefined ? undefined : v === 'true'),
  ENABLE_CHAT_API: z.string().optional().transform(v => v === undefined ? undefined : v === 'true'),
  SERVE_ADMIN_STATIC: z.string().optional().transform(v => v === undefined ? undefined : v === 'true'),
  ADMIN_PUBLIC: z.string().optional().transform(v => v === undefined ? undefined : v === 'true'),
  NEO4J_OPTIONAL: z.string().optional().transform(v => v === undefined ? undefined : v === 'true'),
  PERSIST_CHAT_TURNS: z.string().optional().transform(v => v === undefined ? undefined : v === 'true'),
  NEO4J_MAX_RETRIES: z.string().optional().transform(v => v === undefined ? undefined : parseInt(v, 10)).pipe(z.number().int().positive().catch(5)).optional(),
  NEO4J_RETRY_DELAY_MS: z.string().optional().transform(v => v === undefined ? undefined : parseInt(v, 10)).pipe(z.number().int().nonnegative().catch(1000)).optional()
}).passthrough(); // allow additional vars without failure

function parseCurrent() { return flagsSchema.parse(process.env); }
let parsed = parseCurrent();

// Capture default values for diff / logging reference
const DEFAULTS = {
  CHAT_ECHO_MODE: false,
  ENABLE_CHAT_API: true,
  SERVE_ADMIN_STATIC: false,
  ADMIN_PUBLIC: false,
  NEO4J_OPTIONAL: false,
  NEO4J_MAX_RETRIES: 5,
  NEO4J_RETRY_DELAY_MS: 1000
} as const;

// Normalized exported flags with defaults applied
export let FLAGS = {
  CHAT_ECHO_MODE: parsed.CHAT_ECHO_MODE ?? DEFAULTS.CHAT_ECHO_MODE,
  ENABLE_CHAT_API: parsed.ENABLE_CHAT_API ?? DEFAULTS.ENABLE_CHAT_API,
  SERVE_ADMIN_STATIC: parsed.SERVE_ADMIN_STATIC ?? DEFAULTS.SERVE_ADMIN_STATIC,
  ADMIN_PUBLIC: parsed.ADMIN_PUBLIC ?? DEFAULTS.ADMIN_PUBLIC,
  NEO4J_OPTIONAL: parsed.NEO4J_OPTIONAL ?? DEFAULTS.NEO4J_OPTIONAL,
  PERSIST_CHAT_TURNS: parsed.PERSIST_CHAT_TURNS ?? false,
  NEO4J_MAX_RETRIES: (parsed as any).NEO4J_MAX_RETRIES ?? DEFAULTS.NEO4J_MAX_RETRIES,
  NEO4J_RETRY_DELAY_MS: (parsed as any).NEO4J_RETRY_DELAY_MS ?? DEFAULTS.NEO4J_RETRY_DELAY_MS
} as const;
  

export type BackendFlag = keyof typeof FLAGS;

export function isEnabled(flag: BackendFlag): boolean { return FLAGS[flag] === true; }

// Recompute flags from current process.env (primarily for tests that toggle vars between cases)
export function refreshFlags(): void {
  parsed = parseCurrent();
  FLAGS = {
    CHAT_ECHO_MODE: parsed.CHAT_ECHO_MODE ?? DEFAULTS.CHAT_ECHO_MODE,
    ENABLE_CHAT_API: parsed.ENABLE_CHAT_API ?? DEFAULTS.ENABLE_CHAT_API,
    SERVE_ADMIN_STATIC: parsed.SERVE_ADMIN_STATIC ?? DEFAULTS.SERVE_ADMIN_STATIC,
    ADMIN_PUBLIC: parsed.ADMIN_PUBLIC ?? DEFAULTS.ADMIN_PUBLIC,
    NEO4J_OPTIONAL: parsed.NEO4J_OPTIONAL ?? DEFAULTS.NEO4J_OPTIONAL,
  PERSIST_CHAT_TURNS: parsed.PERSIST_CHAT_TURNS ?? false,
    NEO4J_MAX_RETRIES: (parsed as any).NEO4J_MAX_RETRIES ?? DEFAULTS.NEO4J_MAX_RETRIES,
    NEO4J_RETRY_DELAY_MS: (parsed as any).NEO4J_RETRY_DELAY_MS ?? DEFAULTS.NEO4J_RETRY_DELAY_MS
  } as const;
  
}

// Utility: access raw unknown flag (for future introspection / diagnostics)
export function getRaw(name: string): string | undefined { return env[name]; }

// Log non-default active flags (call during startup). Accepts a logger-like with info method.
export function logNonDefaultFlags(loggerLike: { info: (msg: string, meta?: unknown) => void } | Console = console): void {
  const diffs: Record<string, unknown> = {};
  (Object.keys(FLAGS) as Array<BackendFlag>).forEach(k => {
    const current = FLAGS[k];
    const def = (DEFAULTS as Record<string, unknown>)[k];
    if (current !== def) { diffs[k] = current; }
  });
  if (Object.keys(diffs).length === 0) {
    loggerLike.info('[flags] All flags at default values');
  } else {
    loggerLike.info('[flags] Non-default flags active', diffs);
  }
}

// Assert required env vars exist (fail-fast).  Use in startup or tests.
export function assertRequired(required: Array<string>): void {
  const missing = required.filter(r => !env[r] || env[r] === '');
  if (missing.length) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }
}
