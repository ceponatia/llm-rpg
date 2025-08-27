import { randomUUID } from 'crypto';
import type { ChatRequest, ChatResponse, ChatTurn } from '@rpg/types';
import type { FastifyInstance } from 'fastify';
import { OllamaService } from '../../services/ollama.js';
import { CharacterRegistry } from '../../services/character-registry.js';
import { ChatRepository } from './chatRepository.js';
import type { SessionStore } from './sessionStore.js';

export interface HandleMessageInput extends ChatRequest {
  sessionId?: string; // compatibility camelCase
  character_id?: string; // optional future param (align with existing route logic)
  prompt_template?: string;
  template_vars?: Record<string, string | undefined>;
}

export interface ChatServiceDeps {
  fastify: FastifyInstance;
  repository: ChatRepository;
  sessionStore: SessionStore;
  ollama?: OllamaService; // injectable for tests
}

export class ChatService {
  private readonly ollama: OllamaService;
  private readonly registry = CharacterRegistry.getInstance();
  constructor(private readonly deps: ChatServiceDeps) {
    this.ollama = deps.ollama ?? new OllamaService();
  }

  async handleMessage(input: HandleMessageInput): Promise<ChatResponse & { sessionId: string; reply: string }> {
    const { fastify, repository, sessionStore } = this.deps;
  // Centralized flag (see config/flags.ts)
  const { FLAGS } = await import('../../config/flags.js');
  const echoMode = FLAGS.CHAT_ECHO_MODE;
    const message = input.message;
    const baseSessionId = input.session_id ?? input.sessionId ?? randomUUID();
    const useCharacter = !!input.character_id;
    const sessionId = useCharacter ? `${baseSessionId}:${input.character_id}` : baseSessionId;
    const weights = input.fusion_weights ?? fastify.mca.config.default_fusion_weights;
    let memoryResult: any;
    let response: { response: string; prompt_sections?: unknown };
    let ingestionResult: any = { operations_performed: [], emotional_changes: [] };
    if (echoMode) {
      memoryResult = { l1: { token_count: 0 }, l2: { token_count: 0 }, l3: { token_count: 0 } };
      response = { response: `echo: ${message}` };
    } else {
      memoryResult = await fastify.mca.retrieveRelevantContext({
        query_text: message,
        session_id: sessionId,
        fusion_weights: weights,
        character_id: input.character_id
      });
      response = await this.ollama.generateResponse(message, memoryResult, {
        // Cast to any for now; TODO: tighten with union of known template ids
        templateId: input.prompt_template as any,
        templateVars: input.template_vars ?? {},
        sessionId
      });
    }
    const userTurn: ChatTurn & { tokens?: number; character_id?: string } = {
      id: randomUUID(), role: 'user', content: message, timestamp: new Date().toISOString(),
    };
    const assistantTurn: ChatTurn & { tokens?: number; character_id?: string } = {
      id: randomUUID(), role: 'assistant', content: response.response, timestamp: new Date().toISOString(),
    };
    if (!echoMode) {
      userTurn.tokens = await this.ollama.countTokens(message);
      assistantTurn.tokens = await this.ollama.countTokens(response.response);
      ingestionResult = await fastify.mca.ingestConversationTurn(assistantTurn as any, [userTurn as any], sessionId);
    } else {
      userTurn.tokens = message.length;
      assistantTurn.tokens = response.response.length;
    }
    // Session store update
    sessionStore.addTurns(sessionId, [userTurn, assistantTurn]);
  // Persist (non-echo) – gated by PERSIST_CHAT_TURNS flag (default disabled for stretch readiness)
  const persist = !echoMode && (await import('../../config/flags.js')).FLAGS.PERSIST_CHAT_TURNS;
  if (persist) {
      try {
        await repository.persistTurns({ sessionId, userTurn, assistantTurn, character_id: input.character_id, useCharacter });
      } catch (err) {
        fastify.log.error({ err }, 'Failed to persist turns');
      }
    }
    const chatResponse: ChatResponse = {
      id: assistantTurn.id,
      content: response.response,
      session_id: sessionId,
      timestamp: assistantTurn.timestamp,
      metadata: {
        tokens: {
          total_tokens: (userTurn.tokens ?? 0) + (assistantTurn.tokens ?? 0),
          l1_tokens: memoryResult.l1?.token_count ?? 0,
          l2_tokens: memoryResult.l2?.token_count ?? 0,
          l3_tokens: memoryResult.l3?.token_count ?? 0,
          estimated_cost: 0
        },
        processing_time: 0, // computed at route if desired
        memory_retrieval: memoryResult,
        memory_operations: ingestionResult.operations_performed,
        emotional_state_changes: ingestionResult.emotional_changes?.map((ec: any) => ({
          character_id: ec.character_id,
          character_name: ec.character_id?.replace('character:', ''),
          previous_state: ec.previous_vad,
          new_state: ec.new_vad,
          trigger: ec.trigger
        })),
        prompt_sections: (response as any).prompt_sections
      }
    };
    return { ...chatResponse, sessionId: chatResponse.session_id, reply: chatResponse.content } as any;
  }
}

export function createChatService(deps: ChatServiceDeps): ChatService { return new ChatService(deps); }
