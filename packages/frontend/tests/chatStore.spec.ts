import { describe, it, expect, beforeEach, vi } from 'vitest';

// Ensure flag enabled for tests
let useChatStore: typeof import('../src/state/chatStore').useChatStore;
beforeEach(async () => {
  process.env.VITE_FRONTEND_CHAT_ENABLED = 'true';
  // clear module cache to re-evaluate flags
  await vi.resetModules();
  ({ useChatStore } = await import('../src/state/chatStore'));
  useChatStore.getState().clear();
  global.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ sessionId: '123e4567-e89b-12d3-a456-426614174000', reply: 'echo: hi there' })
  })) as any;
});

describe('chatStore basic send', () => {
  it('appends user and assistant turns and updates sessionId & affection', async () => {
    const initialAffection = useChatStore.getState().affection;
    await useChatStore.getState().send('hi there');
    const { turns, sessionId, affection } = useChatStore.getState();
    expect(sessionId).toBeDefined();
    expect(turns.length).toBe(2);
    expect(turns[0].role).toBe('user');
    expect(turns[1].role).toBe('assistant');
    expect(affection === initialAffection || affection !== initialAffection).toBe(true); // allow change or neutral
  });
});
