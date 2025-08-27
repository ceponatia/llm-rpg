import { describe, it, expect } from 'vitest';
import { ChatRepository } from '../src/modules/chat/chatRepository.js';

class FakeSession {
  public calls: any[] = [];
  async executeWrite(fn: (tx: { run: (c: string, p: any)=>Promise<void> }) => Promise<void>): Promise<void> {
    await fn({ run: async (cypher: string, params: any) => { this.calls.push({ cypher, params, type: 'write' }); } });
  }
  async executeRead(fn: (tx: { run: (c: string, p: any)=>Promise<{ records: any[] }> }) => Promise<{ records: any[] }>): Promise<{ records: any[] }> {
    return fn({ run: async (cypher: string, params: any) => {
      this.calls.push({ cypher, params, type: 'read' });
      return { records: [ { get: () => ({ id: 't1', role: 'user', content: 'hi', timestamp: 'now' }) } ] };
    } });
  }
  async close(): Promise<void> {}
}

class FakeDB { session = new FakeSession(); getNeo4jSession() { return this.session; } }

describe('ChatRepository', () => {
  it('persists turns without character (3 queries)', async () => {
    const db = new FakeDB() as any;
    const repo = new ChatRepository(db);
    await repo.persistTurns({ sessionId: 's1', userTurn: { id: 'u', role: 'user', content: 'hi', timestamp: 'now' }, assistantTurn: { id: 'a', role: 'assistant', content: 'yo', timestamp: 'now' }, useCharacter: false });
  expect((db as any).session.calls.length).toBe(3);
  });
  it('persists turns with character (5 queries)', async () => {
    const db = new FakeDB() as any;
    const repo = new ChatRepository(db);
    await repo.persistTurns({ sessionId: 's2', userTurn: { id: 'u2', role: 'user', content: 'hi', timestamp: 'now' }, assistantTurn: { id: 'a2', role: 'assistant', content: 'yo', timestamp: 'now' }, character_id: 'char1', useCharacter: true });
  expect((db as any).session.calls.length).toBe(5);
  });
  it('fetches recent turns (read query)', async () => {
    const db = new FakeDB() as any;
    const repo = new ChatRepository(db);
    const turns = await repo.getRecentTurns('s1', 10);
    expect(turns.length).toBe(1);
    expect((db as any).session.calls.find((c: any) => c.type === 'read')).toBeDefined();
  });
});
