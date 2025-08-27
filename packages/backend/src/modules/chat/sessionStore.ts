import type { ChatTurn } from '@rpg/types';

export interface SessionTurnsEntry { turns: ChatTurn[] }
export interface SessionStore {
  addTurns(sessionId: string, turns: ChatTurn[]): void;
  get(sessionId: string): SessionTurnsEntry | undefined;
}

// In‑memory bounded session store (last 50 turns) – extracted Sprint 2
class InMemorySessionStore implements SessionStore {
  private readonly store = new Map<string, SessionTurnsEntry>();
  constructor(private readonly maxTurns = 50) {}
  addTurns(sessionId: string, turns: ChatTurn[]): void {
    const entry = this.store.get(sessionId) ?? { turns: [] };
    entry.turns.push(...turns);
    if (entry.turns.length > this.maxTurns) {
      entry.turns.splice(0, entry.turns.length - this.maxTurns);
    }
    this.store.set(sessionId, entry);
  }
  get(sessionId: string): SessionTurnsEntry | undefined { return this.store.get(sessionId); }
  // For legacy test compatibility
  get rawMap(): Map<string, SessionTurnsEntry> { return this.store; }
}

export const inMemorySessionStore = new InMemorySessionStore();
// Backwards compatibility export used by existing tests
export const inMemoryChatSessions = inMemorySessionStore.rawMap;
export type { InMemorySessionStore };
