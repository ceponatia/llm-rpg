import { VADState, TokenCost, MemoryOperation } from './common.js';
import { MemoryRetrievalResult } from './memory.js';

export interface PromptSections {
  system: string;
  working_memory: string;
  episodic_memory: string;
  semantic_archive: string;
  user_query: string;
  full_prompt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    tokens?: TokenCost;
    processing_time?: number;
    memory_operations?: MemoryOperation[];
    memory_retrieval?: MemoryRetrievalResult;
    emotional_state_changes?: VADStateChange[];
    prompt_sections?: PromptSections;
  };
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  created_at: string;
  last_updated: string;
  total_tokens: number;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  fusion_weights?: {
    w_L1: number;
    w_L2: number;
    w_L3: number;
  };
}

export interface ChatResponse {
  id: string;
  content: string;
  session_id: string;
  timestamp: string;
  metadata: {
    tokens: TokenCost;
    processing_time: number;
    memory_retrieval: MemoryRetrievalResult;
    memory_operations: MemoryOperation[];
    emotional_state_changes?: VADStateChange[];
    prompt_sections?: PromptSections;
  };
}


export interface VADStateChange {
  character_id: string;
  character_name: string;
  previous_state: VADState;
  new_state: VADState;
  trigger: string;
}