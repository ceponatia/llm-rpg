import { Ollama } from 'ollama';
import { config } from '../config.js';
import { MemoryRetrievalResult } from '@rpg/types';
import { encoding_for_model, Tiktoken } from 'tiktoken';
import { renderTemplate, injectMemory, type PromptTemplateId } from '../prompts/templates.js';
import { ConsistencyInjector, getConsistencyFragment } from '../prompts/consistency.js';

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

export class OllamaService {
  private ollama: Ollama;
  private tokenizer: Tiktoken | null;

  constructor() {
    this.ollama = new Ollama({ host: config.OLLAMA_BASE_URL });
    // Initialize tokenizer for token counting
    try {
      this.tokenizer = encoding_for_model('gpt-3.5-turbo'); // Close approximation for Mistral
    } catch {
      console.warn('Failed to initialize tokenizer, using fallback estimation');
      this.tokenizer = null;
    }
  }

  async generateResponse(userMessage: string, memoryContext: MemoryRetrievalResult, options?: { templateId?: PromptTemplateId; templateVars?: { char?: string; user?: string; scene?: string }; sessionId?: string }): Promise<LLMResponse & { prompt_sections: { system: string; working_memory: string; episodic_memory: string; semantic_archive: string; user_query: string; full_prompt: string } }> {
    const { fullPrompt, sections } = this.constructPrompt(userMessage, memoryContext, { ...options });
    try {
      const response = await this.ollama.generate({
        model: config.OLLAMA_MODEL,
        prompt: fullPrompt,
        stream: false,
        options: { temperature: 0.7, top_p: 0.9, num_predict: 2000 }
      });
      return { response: response.response, model: config.OLLAMA_MODEL, created_at: new Date().toISOString(), done: true, total_duration: response.total_duration, load_duration: response.load_duration, prompt_eval_count: response.prompt_eval_count, prompt_eval_duration: response.prompt_eval_duration, eval_count: response.eval_count, eval_duration: response.eval_duration, prompt_sections: sections };
    } catch (error) { throw new Error(`Failed to generate response: ${error}`); }
  }

  private constructPrompt(userMessage: string, memoryContext: MemoryRetrievalResult, options?: { templateId?: PromptTemplateId; templateVars?: { char?: string; user?: string; scene?: string }; sessionId?: string }): { fullPrompt: string; sections: { system: string; working_memory: string; episodic_memory: string; semantic_archive: string; user_query: string; full_prompt: string } } {
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
    if (decision.inject) {
      const frag = getConsistencyFragment(options?.templateVars?.char);
      const reasonLine = decision.reason ? `((OOC: consistency reason: ${decision.reason}))\n` : '';
      base = `${reasonLine}${frag}\n\n${base}`;
    }

    // Inject memory block either at {{MEMORY_CONTEXT}} or append to end
    const injected = injectMemory(base, memoryBlock);
    return { fullPrompt: injected, sections: { system: base, working_memory: l1.turns.map(t=>`${t.role}: ${t.content}`).join('\n'), episodic_memory: memoryBlock.split('\n\nSEMANTIC')[0].split('EPISODIC MEMORY (Characters and facts):\n')[1] || '', semantic_archive: l3.fragments.map(f=>`- ${f.content}`).join('\n'), user_query: userMessage, full_prompt: injected } };
  }

  async countTokens(text: string): Promise<number> {
    if (this.tokenizer) {
      try {
        const tokens = this.tokenizer.encode(text);
        return tokens.length;
      } catch {
        console.warn('Tokenizer error, using fallback estimation');
      }
    }
    
    // Fallback: rough estimation (4 characters per token)
    return Math.ceil(text.length / 4);
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await this.ollama.list();
      return Array.isArray(response.models);
    } catch (error) {
      console.error('Ollama connection check failed:', error);
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.ollama.list();
      return response.models.map((model: { name: string }) => model.name);
    } catch (error) {
      console.error('Failed to fetch available models:', error);
      return [];
    }
  }
}