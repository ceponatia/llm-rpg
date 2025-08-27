import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { chatRequestSchema, chatResponseSchema, type ChatRequest, type ChatResponse } from '@rpg/types';
import { createChatService } from '../modules/chat/chatService.js';
import { FLAGS } from '../config/flags.js';
import { ChatRepository } from '../modules/chat/chatRepository.js';
import { inMemorySessionStore, inMemoryChatSessions } from '../modules/chat/sessionStore.js';
import { broadcastChatResponse } from '../modules/chat/broadcastChatResponse.js';

type ChatBody = ChatRequest & {
  prompt_template?: 'default' | 'roleplay' | 'consistency_maintenance';
  template_vars?: { char?: string; user?: string; scene?: string };
  character_id?: string;
  sessionId?: string; // camelCase compatibility
};

// inMemoryChatSessions now sourced from sessionStore (backwards compatible export)
export { inMemoryChatSessions };

export function chatRoutes(fastify: FastifyInstance): void {
  // DEPRECATED: Local ChatRequestSchema / ChatResponseSchema replaced by shared schemas (Sprint 2)
  const ChatRequestSchema = chatRequestSchema.extend({
    // Accept camelCase compatibility fields without enforcing
    sessionId: z.string().uuid().optional(),
    personaId: z.string().optional(),
    persona_id: z.string().optional(),
    fusion_weights: chatRequestSchema.shape.fusion_weights.optional()
  });
  // Extended response schema kept for backward compatibility (local variations)
  // Intentionally not re-used directly below, kept for potential future validation extension.
  chatResponseSchema.extend({
    sessionId: z.string().optional(),
    reply: z.string().optional()
  }).passthrough();
  const chatService = createChatService({
    fastify,
    repository: new ChatRepository(fastify.db),
    sessionStore: inMemorySessionStore
  });

  // Send a chat message
  fastify.post<{ Body: ChatBody }>('/message', async (request, reply) => {
    // Feature flag gate – keeps route dormant until explicitly enabled
  if (!FLAGS.ENABLE_CHAT_API) {
      return reply.status(501).send({ error: 'Chat API disabled (set ENABLE_CHAT_API=true to enable)' });
    }
    const body: ChatBody = request.body;
    // Validate minimal schema (ignore extra advanced fields for now)
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid body', issues: parsed.error.issues });
    }
    const { message, session_id, fusion_weights, prompt_template, template_vars, character_id } = body;
  if (message === '') {
      reply.status(400).send({ error: 'Message text required' });
      return;
    }
  // timing captured only for processing section (overall start unused)
    try {
      const processingStart = Date.now();
      const chatResponse = await chatService.handleMessage({
        message,
        session_id,
        sessionId: body.sessionId, // compatibility
        fusion_weights,
        character_id,
        prompt_template,
        template_vars
      });
      // attach processing time (approximate)
      // Attach processing time without casting whole object to any
  // Mutate existing metadata object (defined in ChatResponse type) with processing_time
  chatResponse.metadata.processing_time = Date.now() - processingStart;
      broadcastChatResponse(fastify.websocketClients, chatResponse as unknown as ChatResponse);
      return chatResponse;
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get chat history for a session
  fastify.get<{ Params: { sessionId: string } }>('/history/:sessionId', async (request, reply) => {
    try {
      const { sessionId } = request.params;
      const history = await fastify.mca.getChatHistory(sessionId);
      return { session_id: sessionId, messages: history };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch chat history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Consolidated session view (turns only) via repository (stretch persistence prep)
  fastify.get<{ Params: { id: string } }>('/session/:id', async (request, reply) => {
    if (!FLAGS.ENABLE_CHAT_API) {
      return reply.status(501).send({ error: 'Chat API disabled' });
    }
    const { id } = request.params;
    try {
      const repo = new ChatRepository(fastify.db);
      const turns = await repo.getRecentTurns(id, 50);
      return { session_id: id, turns };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch session', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get all sessions
  fastify.get('/sessions', async (request, reply) => {
    try {
      const sessions = await fastify.mca.getAllSessions();
      return { sessions };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({
        error: 'Failed to fetch sessions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Character aggregated history
  fastify.get<{ Params: { characterId: string } }>('/character-history/:characterId', async (request, reply) => {
    const { characterId } = request.params;
    try {
      const session = fastify.db.getNeo4jSession();
      const result = await session.executeRead(tx => tx.run(
        `MATCH (c:Character {id: $characterId})-[:PARTICIPATED_IN]->(t:Turn)-[:IN_SESSION]->(s:Session)
         RETURN t { .id, .role, .content, timestamp: toString(t.timestamp), .tokens, character_id: t.character_id, session_id: s.id } AS turn
         ORDER BY t.timestamp ASC`,
        { characterId }
      ));
      await session.close();
  interface TurnRecord { id: string; role: string; content: string; timestamp: string; tokens: number; character_id: string | null; session_id: string }
  const turns = result.records.map(r => r.get('turn') as TurnRecord);
      return { character_id: characterId, turns };
    } catch (err) {
      fastify.log.error({ err }, 'Failed to fetch character history');
      reply.status(500).send({ error: 'Failed to fetch character history' });
    }
  });
}