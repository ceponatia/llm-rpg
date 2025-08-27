import { describe, it, expect } from 'vitest';
import { Neo4jConnection } from '../src/database/neo4j.js';

describe('Neo4jConnection optional mode', () => {
  it('does not throw when auth fails in optional mode', async () => {
    const conn = new Neo4jConnection({
      config: { uri: 'bolt://invalid-host:7687', user: 'x', password: 'y', optional: true, maxRetries: 1, retryDelayMs: 1 },
      driverFactory: () => { throw Object.assign(new Error('authentication failure'), { code: 'Neo.ClientError.Security.Unauthorized' }); }
    });
    await conn.initialize();
    const healthy = await conn.checkHealth();
    expect(healthy).toBe(false);
  });
});
