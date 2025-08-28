import neo4j, { type Driver, type Session } from 'neo4j-driver';
import { logger } from '@rpg/utils';

export interface Neo4jConfig {
  uri: string;
  user: string;
  password: string;
  optional?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface Neo4jConnectionOptions {
  config: Neo4jConfig;
  driverFactory?: typeof neo4j.driver; // injectable for tests
}

function isAuthError(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const anyErr = err as { code?: string; message?: string };
    if (anyErr.code && anyErr.code.includes('Unauthorized')) return true;
    if (anyErr.message && /unauthorized|authentication failure/i.test(anyErr.message)) return true;
  }
  return false;
}

export class Neo4jConnection {
  private driver: Driver | null = null;
  private readonly cfg: Neo4jConfig;
  private readonly driverFactory: typeof neo4j.driver;

  constructor(opts: Neo4jConnectionOptions) {
    this.cfg = opts.config;
    this.driverFactory = opts.driverFactory ?? neo4j.driver;
  }

  public getDriver(): Driver {
    if (this.driver == null) throw new Error('Neo4j driver not initialized');
    return this.driver;
  }

  public getSession(): Session {
    if (this.driver == null) throw new Error('Neo4j driver not initialized');
    return this.driver.session();
  }

  public async initialize(): Promise<void> {
    const { optional, maxRetries = 5, retryDelayMs = 1000 } = this.cfg;
    let attempt = 0;
    while (true) {  
      try {
        this.driver = this.driverFactory(
          this.cfg.uri,
          neo4j.auth.basic(this.cfg.user, this.cfg.password),
          {
            maxConnectionLifetime: 3 * 60 * 60 * 1000,
            maxConnectionPoolSize: 50,
            connectionAcquisitionTimeout: 2 * 60 * 1000
          }
        );
        const session = this.driver.session();
        await session.run('RETURN 1');
        await session.close();
        await this.createConstraints();
        logger.info('Neo4j connection established');
        return;
      } catch (error) {
        attempt++;
        const authFailure = isAuthError(error);
        logger.error(`Neo4j connection attempt ${attempt} failed${authFailure ? ' (auth failure)' : ''}`, error as Error);
        if (authFailure) {
          if (optional) {
            logger.warn('Continuing without Neo4j due to auth failure (optional mode)');
            this.driver = null;
            return;
          }
          throw error;
        }
        if (attempt >= maxRetries) {
          if (optional) {
            logger.warn(`Neo4j unavailable after ${attempt} attempts; continuing in degraded mode`);
            this.driver = null;
            return;
          }
          throw error;
        }
        const backoff = retryDelayMs * attempt;
        await new Promise(res => setTimeout(res, backoff));
      }
    }
  }

  private async createConstraints(): Promise<void> {
    if (this.driver == null) throw new Error('Neo4j driver not initialized');
    const session = this.driver.session();
    try {
      const constraints = [
        'CREATE CONSTRAINT character_id_unique IF NOT EXISTS FOR (c:Character) REQUIRE c.id IS UNIQUE',
        'CREATE CONSTRAINT fact_id_unique IF NOT EXISTS FOR (f:Fact) REQUIRE f.id IS UNIQUE',
        'CREATE CONSTRAINT session_id_unique IF NOT EXISTS FOR (s:Session) REQUIRE s.id IS UNIQUE',
        'CREATE CONSTRAINT turn_id_unique IF NOT EXISTS FOR (t:Turn) REQUIRE t.id IS UNIQUE'
      ];
      const indexes = [
        'CREATE INDEX character_name_index IF NOT EXISTS FOR (c:Character) ON (c.name)',
        'CREATE INDEX fact_entity_index IF NOT EXISTS FOR (f:Fact) ON (f.entity)',
        'CREATE INDEX fact_attribute_index IF NOT EXISTS FOR (f:Fact) ON (f.attribute)',
        'CREATE INDEX turn_timestamp_index IF NOT EXISTS FOR (t:Turn) ON (t.timestamp)',
        'CREATE INDEX session_timestamp_index IF NOT EXISTS FOR (s:Session) ON (s.created_at)'
      ];
      for (const c of [...constraints, ...indexes]) {
        try { await session.run(c); } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Unknown error';
          if (!msg.includes('already exists')) logger.warn(`Neo4j constraint/index warning: ${msg}`);
        }
      }
    } finally {
      await session.close();
    }
  }

  public async checkHealth(): Promise<boolean> {
    if (this.driver == null) return false;
    try {
      const session = this.driver.session();
      await session.run('RETURN 1');
      await session.close();
      return true;
    } catch {
      return false;
    }
  }

  public async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
    }
  }
}
