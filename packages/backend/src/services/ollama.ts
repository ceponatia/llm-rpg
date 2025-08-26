// Strict boolean compliance: all collection length checks explicit; no eslint disables needed.
import { Ollama } from 'ollama';
import { config } from '../config.js';
import type { MemoryRetrievalResult } from '@rpg/types';
import { encoding_for_model, type Tiktoken } from 'tiktoken';
import { renderTemplate, injectMemory, type PromptTemplateId } from '../prompts/templates.js';
import { ConsistencyInjector, getConsistencyFragment } from '../prompts/consistency.js';
import { logger } from '../../../utils/src/logger.ts';

export interface LLMResponse {
  response: string;
  model: string;
  created_at: string;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Structured prompt section breakdown returned alongside generated full prompt.
 * Each field captures a logical slice used for diagnostics / UI inspection.
 */
export interface PromptSections {
  system: string; // Base system / template content (pre-memory injection)
  working_memory: string; // Recent conversation turns (L1)
  episodic_memory: string; // Character & facts portion (from L2)
  semantic_archive: string; // Relevant semantic fragments (from L3)
  user_query: string; // The raw user input driving this generation
  full_prompt: string; // The fully assembled prompt passed to the model
}

export class OllamaService {
  private readonly ollama: Ollama;
  private readonly tokenizer: Tiktoken | null;

  public constructor() {
    this.ollama = new Ollama({ host: config.OLLAMA_BASE_URL });
    // Initialize tokenizer for token counting
    try {
      this.tokenizer = encoding_for_model('gpt-3.5-turbo'); // Close approximation for Mistral
    } catch (err) {
      logger.warn('Failed to initialize tokenizer, using fallback estimation', err);
      this.tokenizer = null;
    }
  }

  /**
   * Generate an LLM response with rich prompt section metadata.
   * Returns the raw model response fields plus a `prompt_sections` object for tracing.
   */
  public async generateResponse(userMessage: string, memoryContext: MemoryRetrievalResult, options?: { templateId?: PromptTemplateId; templateVars?: { char?: string; user?: string; scene?: string }; sessionId?: string }): Promise<LLMResponse & { prompt_sections: PromptSections }> {
    const { fullPrompt, sections } = this.constructPrompt(userMessage, memoryContext, { ...options });
    try {
      const response = await this.ollama.generate({
        model: config.OLLAMA_MODEL,
        prompt: fullPrompt,
        stream: false,
        options: { temperature: 0.7, top_p: 0.9, num_predict: 2000 }
      });
      return { response: response.response, model: config.OLLAMA_MODEL, created_at: new Date().toISOString(), done: true, total_duration: response.total_duration, load_duration: response.load_duration, prompt_eval_count: response.prompt_eval_count, prompt_eval_duration: response.prompt_eval_duration, eval_count: response.eval_count, eval_duration: response.eval_duration, prompt_sections: sections };
  } catch (error) { throw new Error(`Failed to generate response: ${String(error)}`); }
  }

  /**
   * Construct the full prompt and decomposed sections for observability.
   * Pure function: does not perform I/O nor mutate external state.
   */
  private constructPrompt(userMessage: string, memoryContext: MemoryRetrievalResult, options?: { templateId?: PromptTemplateId; templateVars?: { char?: string; user?: string; scene?: string }; sessionId?: string }): { fullPrompt: string; sections: PromptSections } {
    const { l1, l2, l3 } = memoryContext;

    // Build memory context block (existing behavior retained)
    let memoryBlock = `WORKING MEMORY (Recent conversation):\n` +
      l1.turns.map(turn => `${turn.role}: ${turn.content}`).join('\n') +
      `\n\nEPISODIC MEMORY (Characters and facts):\n`;

  if (l2.characters.length > 0) {
      memoryBlock += `Characters:\n`;
      l2.characters.forEach(char => {
        memoryBlock += `- ${char.name}: VAD emotional state (valence: ${char.emotional_state.valence.toFixed(2)}, arousal: ${char.emotional_state.arousal.toFixed(2)}, dominance: ${char.emotional_state.dominance.toFixed(2)})\n`;
      });
    }

  if (l2.facts.length > 0) {
      memoryBlock += `Facts:\n`;
      l2.facts.forEach(fact => {
        memoryBlock += `- ${fact.attribute}: ${fact.current_value} (importance: ${fact.importance_score})\n`;
      });
    }

  if (l2.relationships.length > 0) {
      memoryBlock += `Relationships:\n`;
      l2.relationships.forEach(rel => {
        memoryBlock += `- ${rel.from_entity} ${rel.relationship_type} ${rel.to_entity} (strength: ${rel.strength})\n`;
      });
    }

  if (l3.fragments.length > 0) {
      memoryBlock += `\nSEMANTIC ARCHIVE (Relevant insights):\n`;
      l3.fragments.forEach(fragment => {
        memoryBlock += `- ${fragment.content} (relevance: ${fragment.similarity_score?.toFixed(2)})\n`;
      });
    }

    memoryBlock += `\nCurrent user message: ${userMessage}\n\nPlease respond naturally, incorporating relevant information from the memory context above. Be conversational and helpful.\n\nResponse:`;

    // Base template selection and rendering
    const configuredTemplate: PromptTemplateId = config.PROMPT_TEMPLATE;
    const templateId: PromptTemplateId = options?.templateId ?? configuredTemplate;
    let base = renderTemplate(templateId, options?.templateVars);

    // Optionally inject a lightweight consistency fragment for roleplay
    const decision = ConsistencyInjector.shouldInject({
      sessionId: options?.sessionId,
      userMessage,
      memory: memoryContext,
      templateId
    });
      if (decision.inject === true) {
        const frag = getConsistencyFragment(options?.templateVars?.char);
        const hasReason = typeof decision.reason === 'string' && decision.reason.length > 0;
        const reasonLine = hasReason ? `((OOC: consistency reason: ${decision.reason}))\n` : '';
      base = `${reasonLine}${frag}\n\n${base}`;
    }

    // Inject memory block either at {{MEMORY_CONTEXT}} or append to end
    const injected = injectMemory(base, memoryBlock);
    return { fullPrompt: injected, sections: { system: base, working_memory: l1.turns.map(t=>`${t.role}: ${t.content}`).join('\n'), episodic_memory: memoryBlock.split('\n\nSEMANTIC')[0].split('EPISODIC MEMORY (Characters and facts):\n')[1] ?? '', semantic_archive: l3.fragments.map(f=>`- ${f.content}`).join('\n'), user_query: userMessage, full_prompt: injected } };
  }

  public async countTokens(text: string): Promise<number> {
    await Promise.resolve();
    if (this.tokenizer != null) {
      try {
        const tokens = this.tokenizer.encode(text);
        return tokens.length;
      } catch (err) {
        logger.warn('Tokenizer error, using fallback estimation', err);
      }
    }
    // Fallback: rough estimation (4 characters per token)
    return Math.ceil(text.length / 4);
  }

  public async checkConnection(): Promise<boolean> {
    try {
      const response: unknown = await this.ollama.list();
      if (typeof response === 'object' && response != null && 'models' in response && Array.isArray((response as { models: unknown }).models)) {
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Ollama connection check failed', error);
      return false;
    }
  }

  public async getAvailableModels(): Promise<Array<string>> {
    try {
      const response: unknown = await this.ollama.list();
      if (typeof response === 'object' && response != null && 'models' in response && Array.isArray((response as { models: unknown }).models)) {
        const models = (response as { models: Array<{ name: string }> }).models;
        return models.map(m => m.name);
      }
      return [];
    } catch (error) {
      logger.error('Failed to fetch available models', error);
      return [];
    }
  }
}