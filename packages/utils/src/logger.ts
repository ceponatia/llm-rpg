/**
 * Simple logging utility for the CAS project
 */
export class Logger {
  private static levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  private static currentLevel = Logger.levels.info;

  static setLevel(level: keyof typeof Logger.levels): void {
    Logger.currentLevel = Logger.levels[level];
  }

  static debug(message: string, ...args: unknown[]): void {
    if (Logger.currentLevel <= Logger.levels.debug) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  static info(message: string, ...args: unknown[]): void {
    if (Logger.currentLevel <= Logger.levels.info) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  static warn(message: string, ...args: unknown[]): void {
    if (Logger.currentLevel <= Logger.levels.warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  static error(message: string, ...args: unknown[]): void {
    if (Logger.currentLevel <= Logger.levels.error) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}