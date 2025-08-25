/**
 * Simple logging utility for the CAS project.
 * Converted from static class to object literal to satisfy no-extraneous-class.
 */
const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
} as const;

let currentLevel: number = levels.info;

export const logger = {
  setLevel(level: keyof typeof levels): void {
    currentLevel = levels[level];
  },
  debug(message: string, ...args: Array<unknown>): void {
    if (currentLevel <= levels.debug) {
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  info(message: string, ...args: Array<unknown>): void {
    if (currentLevel <= levels.info) {
      // eslint-disable-next-line no-console
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  warn(message: string, ...args: Array<unknown>): void {
    if (currentLevel <= levels.warn) {
      // eslint-disable-next-line no-console
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error(message: string, ...args: Array<unknown>): void {
    if (currentLevel <= levels.error) {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
} as const;

export type Logger = typeof logger;