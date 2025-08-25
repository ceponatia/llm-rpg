import neo4j, { type Driver, type Session, type Integer } from 'neo4j-driver';
// import { FaissNode } from 'faiss-node';
import { createClient, type RedisClientType } from 'redis';
import { promises as fs } from 'fs';
import { dirname } from 'path';
// Using local copy of interface until mca package builds and exports properly
import type { IDatabaseManager } from '../../../mca/src/interfaces/database.js';
import { logger } from '../../../utils/src/logger.ts';

interface Neo4jConfig {
  uri: string;
  user: string;
  password: string;
}

interface FaissConfig {
  indexPath: string;
  dimension: number;
}

interface RedisConfig {
  url: string;
}

interface DatabaseConfig {
  neo4j: Neo4jConfig;
  faiss: FaissConfig;
  redis?: RedisConfig;
}

// Minimal mock FAISS index shape used in code
interface MockFaissIndex {
  add(v: Array<Array<number>>): void;
  search(v: Array<Array<number>>, k: number): { distances: Array<Array<number>>; labels: Array<Array<number>> };
  ntotal(): number;
  writeIndex(path: string): Promise<void>;
  readIndex(path: string): Promise<void>;
}

export class DatabaseManager implements IDatabaseManager {
  private neo4jDriver: Driver | null = null;
  private faissIndex: MockFaissIndex | null = null;
  public redis: RedisClientType | null = null;
  
  public constructor(private readonly config: DatabaseConfig) {}

  public async initialize(): Promise<void> {
    await this.initializeNeo4j();
    await this.initializeFaiss();
    if (this.config.redis != null) {
      await this.initializeRedis();
    }
  }

  private async initializeNeo4j(): Promise<void> {
    try {
      this.neo4jDriver = neo4j.driver(
        this.config.neo4j.uri,
        neo4j.auth.basic(this.config.neo4j.user, this.config.neo4j.password),
        {
          maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
        }
      );

      // Test connection
      const session = this.neo4jDriver.session();
      await session.run('RETURN 1');
      await session.close();
      
      // Create constraints and indexes
      await this.createNeo4jConstraints();
      
      logger.info('Neo4j connection established');
    } catch (error) {
      logger.error('Failed to connect to Neo4j', error);
      throw error;
    }
  }

  private async createNeo4jConstraints(): Promise<void> {
    const driver = this.neo4jDriver;
    if (driver == null) {
      throw new Error('Neo4j driver not initialized');
    }
    const session = driver.session();
    
    try {
      // Create constraints for unique IDs
      const constraints = [
        'CREATE CONSTRAINT character_id_unique IF NOT EXISTS FOR (c:Character) REQUIRE c.id IS UNIQUE',
        'CREATE CONSTRAINT fact_id_unique IF NOT EXISTS FOR (f:Fact) REQUIRE f.id IS UNIQUE',
        'CREATE CONSTRAINT session_id_unique IF NOT EXISTS FOR (s:Session) REQUIRE s.id IS UNIQUE',
        'CREATE CONSTRAINT turn_id_unique IF NOT EXISTS FOR (t:Turn) REQUIRE t.id IS UNIQUE'
      ];

      for (const constraint of constraints) {
        try {
          await session.run(constraint);
        } catch (error: unknown) {
          // Constraint might already exist, that's okay
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (!errorMessage.includes('already exists')) {
            logger.warn(`Constraint creation warning: ${errorMessage}`);
          }
        }
      }

      // Create indexes for performance
      const indexes = [
        'CREATE INDEX character_name_index IF NOT EXISTS FOR (c:Character) ON (c.name)',
        'CREATE INDEX fact_entity_index IF NOT EXISTS FOR (f:Fact) ON (f.entity)',
        'CREATE INDEX fact_attribute_index IF NOT EXISTS FOR (f:Fact) ON (f.attribute)',
        'CREATE INDEX turn_timestamp_index IF NOT EXISTS FOR (t:Turn) ON (t.timestamp)',
        'CREATE INDEX session_timestamp_index IF NOT EXISTS FOR (s:Session) ON (s.created_at)'
      ];

      for (const index of indexes) {
        try {
          await session.run(index);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (!errorMessage.includes('already exists')) {
            logger.warn(`Index creation warning: ${errorMessage}`);
          }
        }
      }
    } finally {
      await session.close();
    }
  }

  private async initializeFaiss(): Promise<void> {
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(dirname(this.config.faiss.indexPath), { recursive: true });

      // Mock FAISS initialization (would use actual FaissNode in production)
      this.faissIndex = {
        add: (v: Array<Array<number>>): void => { void v; },
        search: (v: Array<Array<number>>, k: number): { distances: Array<Array<number>>; labels: Array<Array<number>> } => { void v; void k; return { distances: [[]], labels: [[]] }; },
        ntotal: (): number => 0,
        // Return resolved promises without triggering require-await rule
        writeIndex: (p: string): Promise<void> => { void p; return Promise.resolve(); },
        readIndex: (p: string): Promise<void> => { void p; return Promise.resolve(); }
      };
      logger.info('Mock FAISS index created');
    } catch (error) {
      logger.error('Failed to initialize FAISS', error);
      throw error;
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      const redisCfg = this.config.redis;
      if (redisCfg == null) {
        return; // optional
      }
      this.redis = createClient({ url: redisCfg.url });
      await this.redis.connect();
      
      // Test connection
      await this.redis.ping();
      logger.info('Redis connection established');
    } catch (error) {
      logger.error('Failed to connect to Redis', error);
      // Redis is optional, so we don't throw here
      this.redis = null;
    }
  }

  public async checkNeo4jHealth(): Promise<boolean> {
    if (this.neo4jDriver == null) { return false; }
    
    try {
      const session = this.neo4jDriver.session();
      await session.run('RETURN 1');
      await session.close();
      return true;
    } catch {
      return false;
    }
  }

  public getNeo4jSession(): Session {
    if (this.neo4jDriver == null) {
      throw new Error('Neo4j driver not initialized');
    }
    return this.neo4jDriver.session();
  }

  public getDriver(): Driver {
    if (this.neo4jDriver == null) {
      throw new Error('Neo4j driver not initialized');
    }
    return this.neo4jDriver;
  }

  public getFaissIndex(): MockFaissIndex {
    if (this.faissIndex == null) {
      throw new Error('FAISS index not initialized');
    }
    return this.faissIndex;
  }

  public async saveFaissIndex(): Promise<void> {
    if (this.faissIndex !== null) {
      await this.faissIndex.writeIndex(this.config.faiss.indexPath);
    }
  }

  public async close(): Promise<void> {
    if (this.neo4jDriver !== null) {
      await this.neo4jDriver.close();
    }
    
    if (this.faissIndex !== null) {
      await this.saveFaissIndex();
    }
    
    if (this.redis !== null) {
      await this.redis.quit();
    }
    
    logger.info('Database connections closed');
  }

  // High-level aggregate stats for lightweight public summary
  public async getHighLevelStats(): Promise<{ sessions: number; characters: number; facts: number; lastEventAt?: string } > {
    if (this.neo4jDriver == null) { throw new Error('Neo4j driver not initialized'); }
    const session = this.neo4jDriver.session();
    try {
      const result = await session.run(`
        MATCH (s:Session) RETURN count(s) AS sessions;
      `);
      const sessions = extractNumber(result.records[0]?.get('sessions'));

      const charsResult = await session.run('MATCH (c:Character) RETURN count(c) AS characters');
      const characters = extractNumber(charsResult.records[0]?.get('characters'));

      const factsResult = await session.run('MATCH (f:Fact) RETURN count(f) AS facts');
      const facts = extractNumber(factsResult.records[0]?.get('facts'));

  const lastEventResult = await session.run('MATCH (t:Turn) RETURN t.timestamp AS ts ORDER BY t.timestamp DESC LIMIT 1');
  const lastEventAtRaw: unknown = lastEventResult.records[0]?.get('ts');
      const lastEventAt = typeof lastEventAtRaw === 'string' ? lastEventAtRaw : undefined;
      return { sessions, characters, facts, lastEventAt };
    } finally {
      await session.close();
    }
  }
}

// Helper utilities (file-local): number extraction from potentially neo4j Integer values
function isNeo4jInteger(value: unknown): value is Integer {
  return typeof value === 'object' && value !== null && 'toNumber' in value && typeof (value as { toNumber?: unknown }).toNumber === 'function';
}

function extractNumber(value: unknown): number {
  if (typeof value === 'number') { return value; }
  if (isNeo4jInteger(value)) {
    try {
      return value.toNumber();
    } catch {
      return 0;
    }
  }
  return 0;
}