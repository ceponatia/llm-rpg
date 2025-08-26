// Feature flag utility
// Reads boolean-like environment variables exposed by Vite (prefixed with VITE_)
// Only currently supported/active flag is FRONTEND_CHAT_ENABLED. Others are placeholders.

const raw = import.meta.env;

function bool(name: string, defaultValue = false): boolean {
  const v = (raw as any)[name];
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
