// Feature flag utility
// Reads boolean-like environment variables exposed by Vite (prefixed with VITE_)
// Only currently supported/active flag is FRONTEND_CHAT_ENABLED. Others are placeholders.

type EnvLike = Record<string, string | boolean | number | undefined>;
// Narrow import.meta.env without using any
const raw: EnvLike = (typeof import.meta !== 'undefined' && typeof (import.meta as unknown) === 'object'
  && 'env' in import.meta
  && typeof (import.meta as { env?: unknown }).env === 'object'
  ? (import.meta as { env: EnvLike }).env
  : {});
// Access process.env defensively (process may be undefined in browser builds)
declare const process: { env: EnvLike } | undefined; // ambient for TS/browser hybrid
const proc: EnvLike = typeof process !== 'undefined' ? process.env : {};

function bool(name: string, defaultValue = false): boolean {
  const v = raw[name] ?? proc[name];
  if (v == null) return defaultValue;
  const s = String(v).toLowerCase().trim();
  return ['1', 'true', 'yes', 'on'].includes(s);
}

export const FLAGS = {
  FRONTEND_CHAT_ENABLED: bool('VITE_FRONTEND_CHAT_ENABLED', false),
  // FRONTEND_VECTOR_SEARCH: bool('VITE_FRONTEND_VECTOR_SEARCH', false), // placeholder
  // SHOW_DEBUG_PANELS: bool('VITE_SHOW_DEBUG_PANELS', false), // placeholder
  // ENABLE_WS_RECONNECT_TRACE: bool('VITE_ENABLE_WS_RECONNECT_TRACE', false), // placeholder
};

export function isEnabled(flag: keyof typeof FLAGS): boolean {
  return FLAGS[flag];
}
