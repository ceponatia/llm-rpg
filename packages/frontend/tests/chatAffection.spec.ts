import { describe, it, expect, beforeEach, vi } from 'vitest';

let useChatStore: typeof import('../src/state/chatStore').useChatStore;

beforeEach(async () => {
  process.env.VITE_FRONTEND_CHAT_ENABLED = 'true';
  await vi.resetModules();
  ({ useChatStore } = await import('../src/state/chatStore'));
  useChatStore.getState().clear();
});

describe('chatStore affection deltas', () => {
  it('increments affection on excited intent keywords', async () => {
    const start = useChatStore.getState().affection;
    // mock fetch reply
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ sessionId: 's1', reply: 'ok' }) })) as any;
    await useChatStore.getState().send('I love this!');
    const { affection, lastIntent } = useChatStore.getState();
    expect(lastIntent).toBe('excited');
    expect(affection).toBe(start + 2 <= 100 ? start + 2 : 100);
  });

  it('decrements affection on annoyed intent keywords', async () => {
    const start = useChatStore.getState().affection;
    global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ sessionId: 's1', reply: 'ok' }) })) as any;
    await useChatStore.getState().send('This is boring');
    const { affection, lastIntent } = useChatStore.getState();
    expect(lastIntent).toBe('annoyed');
    expect(affection).toBe(start - 2 >= 0 ? start - 2 : 0);
  });
});
