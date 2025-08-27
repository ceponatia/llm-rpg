import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import { ChatRepository } from '../src/modules/chat/chatRepository.js';
import { inMemorySessionStore } from '../src/modules/chat/sessionStore.js';
import { createChatService } from '../src/modules/chat/chatService.js';

// Minimal fastify stub
function buildFastify() {
  const f = Fastify({ logger: false });
  // mca stub
  f.decorate('mca', {
    config: {
      l1_max_turns: 50,
      l1_max_tokens: 2000,
      l2_significance_threshold: 0.5,
      l2_emotional_delta_threshold: 0.1,
      l3_vector_dimension: 1536,
      l3_max_fragments: 1000,
      default_fusion_weights: { w_L1: 0.4, w_L2: 0.4, w_L3: 0.2 },
      importance_decay_rate: 0.01,
      access_boost_factor: 1.2,
      recency_boost_factor: 1.1
    },
    retrieveRelevantContext: async () => ({
      l1: { turns: [], relevance_score: 0, token_count: 0 },
      l2: { characters: [], facts: [], relationships: [], relevance_score: 0, token_count: 0 },
      l3: { fragments: [], relevance_score: 0, token_count: 0 },
      fusion_weights: { w_L1: 0.4, w_L2: 0.4, w_L3: 0.2 },
      final_score: 0,
      total_tokens: 0
    }),
    ingestConversationTurn: async () => ({
      success: true,
      operations_performed: [],
      significance_score: 0,
      events_detected: [],
      emotional_changes: [],
      facts_updated: [],
      relationships_modified: []
    })
  } as any);
  // db stub (neo4j session minimal shape)
  f.decorate('db', {
    getNeo4jSession: () => ({
      executeWrite: async (work: any) => work({ run: async () => ({ records: [] }) }),
      close: async () => {}
    })
  } as any);
  return f;
}

describe('ChatService echo mode', () => {
  it('produces echo response and stores turns', async () => {
    process.env.CHAT_ECHO_MODE = 'true';
    const f = buildFastify();
  const service = createChatService({ fastify: f as any, repository: new ChatRepository((f as any).db), sessionStore: inMemorySessionStore });
    const res = await service.handleMessage({ message: 'hello test' });
    expect(res.reply).toBe('echo: hello test');
  expect(inMemorySessionStore.get(res.sessionId)?.turns.length).toBe(2);
  });
});
