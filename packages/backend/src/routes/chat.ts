import type { FastifyInstance } from 'fastify';
import type { ChatRequest, ChatResponse } from '@rpg/types';
import { OllamaService } from '../services/ollama.js';
import { randomUUID } from 'crypto';
import { CharacterRegistry } from '../services/character-registry.js';

type ChatBody = ChatRequest & {
  prompt_template?: 'default' | 'roleplay' | 'consistency_maintenance';
  template_vars?: { char?: string; user?: string; scene?: string };
  character_id?: string;
};

export function chatRoutes(fastify: FastifyInstance): void {
  const ollama = new OllamaService();
  const characterRegistry = CharacterRegistry.getInstance();

  // Send a chat message
  fastify.post<{ Body: ChatBody }>('/message', async (request, reply) => {
    const body: ChatBody = request.body;
    const { message, session_id, fusion_weights, prompt_template, template_vars, character_id } = body;
  if (message === '') {
      reply.status(400).send({ error: 'Message text required' });
      return;
    }
    const startTime = Date.now();
    
    try {
      // Use provided session_id or create new one
  const baseSessionId = session_id ?? randomUUID();
  const useCharacter = character_id !== undefined && character_id !== '';
  const sessionId = useCharacter ? `${baseSessionId}:${character_id}` : baseSessionId;
      
      // Use provided fusion weights or defaults
  const weights = fusion_weights ?? fastify.mca.config.default_fusion_weights;

      // Character handling
  let effectiveTemplate = prompt_template;
      const vars = { ...template_vars };
      if (useCharacter) {
        const profile = characterRegistry.get(character_id);
  if (profile !== undefined) {
          effectiveTemplate ??= 'roleplay';
          const salientAttributes = (profile.attributes ?? [])
            .filter((a: { salience?: number }) => (a.salience ?? 0) >= 0.6)
            .slice(0, 8);
          const attrText = salientAttributes.map((a: { key: string; value: unknown }) => {
            const raw: unknown = a.value;
            const val: unknown = typeof raw === 'object' && raw !== null && 'value' in (raw as Record<string, unknown>) ? (raw as Record<string, unknown>).value : a.value;
            return `${a.key.replace(/_/g,' ')}: ${String(val)}`;
          }).join('; ');
          vars.char = `${profile.name}${attrText !== '' ? ' | ' + attrText : ''}`;
        }
      }
      
      // Retrieve relevant context from memory layers (scoped by session + character)
      const memoryResult = await fastify.mca.retrieveRelevantContext({
        query_text: message,
        session_id: sessionId,
        fusion_weights: weights,
        character_id: character_id
      });
      
      // Generate response using Ollama with optional template
      const response = await ollama.generateResponse(message, memoryResult, {
        templateId: effectiveTemplate,
        templateVars: vars,
        sessionId
      });
      
      // Process the conversation turn for memory ingestion
      const userTurn = {
        id: randomUUID(),
        role: 'user' as const,
        content: message,
        timestamp: new Date().toISOString(),
        tokens: await ollama.countTokens(message),
        character_id: character_id
      };
      
      const assistantTurn = {
        id: randomUUID(),
        role: 'assistant' as const,
        content: response.response,
        timestamp: new Date().toISOString(),
        tokens: await ollama.countTokens(response.response),
        character_id: character_id
      };
      
      // Ingest conversation turns into memory
      const ingestionResult = await fastify.mca.ingestConversationTurn(
        assistantTurn,
        [userTurn],
        sessionId
      );
      
      // Persist turns to Neo4j for cross-session history
      try {
        const neo4jSession = fastify.db.getNeo4jSession();
        await neo4jSession.executeWrite(async tx => {
          // Ensure Session node
            await tx.run(
              'MERGE (s:Session {id: $sessionId}) ON CREATE SET s.created_at = timestamp() SET s.last_updated = timestamp()',
              { sessionId }
            );
          // Create user turn
          await tx.run(
            `MERGE (t:Turn {id: $id})
             ON CREATE SET t.role = $role, t.content = $content, t.timestamp = datetime($timestamp), t.tokens = $tokens, t.session_id = $sessionId, t.character_id = $characterId
             ON MATCH SET t.last_seen = timestamp()
             WITH t
             MATCH (s:Session {id: $sessionId})
             MERGE (t)-[:IN_SESSION]->(s)`,
            { id: userTurn.id, role: userTurn.role, content: userTurn.content, timestamp: userTurn.timestamp, tokens: userTurn.tokens, sessionId, characterId: character_id ?? null }
          );
          // Create assistant turn
          await tx.run(
            `MERGE (t:Turn {id: $id})
             ON CREATE SET t.role = $role, t.content = $content, t.timestamp = datetime($timestamp), t.tokens = $tokens, t.session_id = $sessionId, t.character_id = $characterId
             ON MATCH SET t.last_seen = timestamp()
             WITH t
             MATCH (s:Session {id: $sessionId})
             MERGE (t)-[:IN_SESSION]->(s)`,
            { id: assistantTurn.id, role: assistantTurn.role, content: assistantTurn.content, timestamp: assistantTurn.timestamp, tokens: assistantTurn.tokens, sessionId, characterId: character_id ?? null }
          );
          if (useCharacter) {
            await tx.run(
              'MATCH (c:Character {id: $characterId}) MATCH (t:Turn {id: $turnId}) MERGE (c)-[:PARTICIPATED_IN]->(t)',
              { characterId: character_id, turnId: assistantTurn.id }
            );
            await tx.run(
              'MATCH (c:Character {id: $characterId}) MATCH (t:Turn {id: $turnId}) MERGE (c)-[:PARTICIPATED_IN]->(t)',
              { characterId: character_id, turnId: userTurn.id }
            );
          }
        });
        await neo4jSession.close();
      } catch (persistErr) {
        fastify.log.error({ err: persistErr }, 'Failed to persist turns');
      }
      
      const processingTime = Date.now() - startTime;
      
      const chatResponse: ChatResponse = {
        id: assistantTurn.id,
        content: response.response,
        session_id: sessionId,
        timestamp: assistantTurn.timestamp,
        metadata: {
          tokens: {
            total_tokens: userTurn.tokens + assistantTurn.tokens,
            l1_tokens: memoryResult.l1.token_count,
            l2_tokens: memoryResult.l2.token_count,
            l3_tokens: memoryResult.l3.token_count,
            estimated_cost: 0 // TODO: Calculate actual cost
          },
          processing_time: processingTime,
          memory_retrieval: memoryResult,
          memory_operations: ingestionResult.operations_performed,
            emotional_state_changes: ingestionResult.emotional_changes.map((ec: { character_id: string; previous_vad: { valence: number; arousal: number; dominance: number }; new_vad: { valence: number; arousal: number; dominance: number }; trigger: string }) => ({
              character_id: ec.character_id,
              character_name: ec.character_id.replace('character:', ''),
              previous_state: ec.previous_vad,
              new_state: ec.new_vad,
              trigger: ec.trigger
            })),
          prompt_sections: response.prompt_sections
        }
      };
      
      // Broadcast to WebSocket clients
      fastify.websocketClients?.forEach(client => {
        if (client.readyState === 1) { // OPEN constant from ws
          client.send(JSON.stringify({
            type: 'chat_response',
            data: chatResponse
          }));
        }
      });
      
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