import { describe, it, expect, beforeEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { setupRoutes } from '../src/routes/index.js';
import { inMemoryChatSessions } from '../src/routes/chat.js';

// Helper to spin up a minimal Fastify without MCA / heavy deps for echo mode
async function build(opts: { enable: boolean; echo: boolean }): Promise<FastifyInstance> {
  // set flags
  process.env.ENABLE_CHAT_API = opts.enable ? 'true' : 'false';
  process.env.CHAT_ECHO_MODE = opts.echo ? 'true' : 'false';
  const fastify: FastifyInstance = Fastify({ logger: false });
  // minimal stubs for properties accessed in chat route when echo mode true (skips heavy calls)
  fastify.decorate('mca', {
    config: { default_fusion_weights: { w_L1: 0.4, w_L2: 0.4, w_L3: 0.2 } },
    retrieveRelevantContext: async () => ({ l1: { token_count: 0 }, l2: { token_count: 0 }, l3: { token_count: 0 } }),
    ingestConversationTurn: async () => ({ operations_performed: [], emotional_changes: [] })
  });
  fastify.decorate('db', { getNeo4jSession: () => ({ executeWrite: async () => {}, close: async () => {} }) });
  await setupRoutes(fastify);
  await fastify.ready();
  return fastify;
}

describe('chat route feature flag & echo mode', () => {
  beforeEach(() => {
    delete process.env.ENABLE_CHAT_API;
    delete process.env.CHAT_ECHO_MODE;
  });

  it('returns 501 when feature flag disabled', async () => {
    const fastify = await build({ enable: false, echo: true });
    const res = await fastify.inject({ method: 'POST', url: '/api/chat/message', payload: { message: 'hi' } });
    expect(res.statusCode).toBe(501);
    await fastify.close();
  });

  it('returns 400 on empty message when enabled', async () => {
    const fastify = await build({ enable: true, echo: true });
    const res = await fastify.inject({ method: 'POST', url: '/api/chat/message', payload: { message: '' } });
    expect(res.statusCode).toBe(400);
    await fastify.close();
  });

  it('echoes reply in echo mode', async () => {
    const fastify = await build({ enable: true, echo: true });
    const res = await fastify.inject({ method: 'POST', url: '/api/chat/message', payload: { message: 'hello world' } });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as any;
    expect(body.reply).toBe('echo: hello world');
    expect(body.sessionId).toBeDefined();
    expect(body.session_id).toBeDefined();
    expect(body.metadata).toBeDefined();
    // Session store should contain two turns for this session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entry = inMemoryChatSessions.get(body.sessionId);
    expect(entry).toBeDefined();
    expect(entry?.turns.length).toBe(2);
    await fastify.close();
  });

  it('bounds session turns to last 50', async () => {
    const fastify = await build({ enable: true, echo: true });
    let sessionId: string | undefined;
    for (let i = 0; i < 60; i++) {
      const res = await fastify.inject({ method: 'POST', url: '/api/chat/message', payload: { message: 'msg ' + i, sessionId } });
      const body = JSON.parse(res.body) as any;
      sessionId = body.sessionId;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entry = inMemoryChatSessions.get(sessionId!);
    expect(entry?.turns.length).toBeLessThanOrEqual(50);
    await fastify.close();
  });
});
