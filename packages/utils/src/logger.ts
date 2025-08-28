/** Centralized logger (color + timestamp). Only file allowed to use console.* */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

interface InternalConfig { level: LogLevel; colors: boolean; }
const cfg: InternalConfig = {
  level: ((): LogLevel => {
    // Read LOG_LEVEL from any runtime (Node or browser with injected env)
    const raw = (globalThis as unknown as { process?: { env?: Record<string, unknown> } })
      .process?.env?.LOG_LEVEL;
    const lower = typeof raw === 'string' ? raw.toLowerCase() : '';
    if (lower === 'debug' || lower === 'info' || lower === 'warn' || lower === 'error') {
      return lower;
    }
    // Dev mode: Vite / ESBuild style import.meta.env.DEV === true enables verbose debug
    const devFlag = ((import.meta as unknown as { env?: Record<string, unknown> }).env?.DEV) === true;
    return devFlag ? 'debug' : 'info';
  })(),
  colors: true
};

const colorCode: Record<LogLevel, string> = { debug: '36', info: '32', warn: '33', error: '31' };
const color = (code: string, txt: string): string => cfg.colors ? `\u001b[${code}m${txt}\u001b[0m` : txt;
const enabled = (lvl: LogLevel): boolean => ORDER[lvl] >= ORDER[cfg.level];
const prefix = (lvl: LogLevel): string => `${new Date().toISOString()} ${color(colorCode[lvl], lvl.toUpperCase().padEnd(5, ' '))}`;

export const logger = {
  setLevel(level: LogLevel): void { cfg.level = level; },
  setColors(on: boolean): void { cfg.colors = on; },
  debug(message: string, ...args: unknown[]): void {
    if (enabled('debug')) {
      console.debug(prefix('debug'), message, ...args);
    }
  },
  info(message: string, ...args: unknown[]): void {
    if (enabled('info')) {
      console.info(prefix('info'), message, ...args);
    }
  },
  warn(message: string, ...args: unknown[]): void {
    if (enabled('warn')) {
      console.warn(prefix('warn'), message, ...args);
    }
  },
  error(message: string, ...args: unknown[]): void {
    if (enabled('error')) {
      console.error(prefix('error'), message, ...args);
    }
  }
} as const;

export type Logger = typeof logger;