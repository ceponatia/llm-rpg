import type { Integer, Session, Driver } from 'neo4j-driver';
import type { IDatabaseManager } from '../../../mca/src/interfaces/database.js';
import { logger } from '@rpg/utils';
import { Neo4jConnection, type Neo4jConfig } from './neo4j.js';
import { VectorIndex, type FaissConfig, type MockFaissIndex } from './vector.js';
import { RedisConnection, type RedisConfig } from './redis.js';

interface DatabaseConfig { neo4j: Neo4jConfig; faiss: FaissConfig; redis?: RedisConfig }

export class DatabaseManager implements IDatabaseManager {
  private readonly neo4j: Neo4jConnection;
  private readonly vector: VectorIndex;
  private readonly redis: RedisConnection;

  constructor(private readonly config: DatabaseConfig) {
    this.neo4j = new Neo4jConnection({ config: config.neo4j });
    this.vector = new VectorIndex(config.faiss);
    this.redis = new RedisConnection(config.redis);
  }

  public async initialize(): Promise<void> {
    await this.neo4j.initialize();
    await this.vector.initialize();
    await this.redis.initialize();
  }

  public async checkNeo4jHealth(): Promise<boolean> { return this.neo4j.checkHealth(); }
  public getNeo4jSession(): Session { return this.neo4j.getSession(); }
  public getDriver(): Driver { return this.neo4j.getDriver(); }
  public getFaissIndex(): MockFaissIndex { return this.vector.getIndex(); }
  public async saveFaissIndex(): Promise<void> { await this.vector.save(); }
  public async close(): Promise<void> { await Promise.all([this.neo4j.close(), this.vector.save(), this.redis.close()]); logger.info('Database connections closed'); }
  public hasRedis(): boolean { return (this as any).redis?.client != null; }

  // High-level aggregate stats for lightweight public summary
  public async getHighLevelStats(): Promise<{ sessions: number; characters: number; facts: number; lastEventAt?: string } > {
  const session = this.getNeo4jSession();
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

// auth error detection moved to neo4j.ts