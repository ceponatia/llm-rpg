import { VADState, Timestamp, AccessMetrics, ImportanceScore, MemoryOperation } from './common.js';

// L1 Working Memory Types
export interface WorkingMemoryTurn {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tokens: number;
  character_id?: string; // optional for per-character persistent history
}

export interface WorkingMemory {
  turns: WorkingMemoryTurn[];
  max_turns: number;
  total_tokens: number;
}

// L2 Graph Memory Types
export interface Character extends Timestamp {
  id: string;
  name: string;
  type: 'Character';
  emotional_state: VADState;
}

export interface FactVersion {
  value: string;
  timestamp: string;
  confidence?: number;
}

export interface FactNode extends Timestamp {
  id: string;
  entity: string;
  attribute: string;
  current_value: string;
  history: FactVersion[];
  importance_score: number;
}

export interface RelationshipEdge extends Timestamp {
  id: string;
  from_entity: string;
  to_entity: string;
  relationship_type: string;
  strength: number; // 0-1
  emotional_context?: VADState;
}

export interface GraphMemory {
  characters: Map<string, Character>;
  facts: Map<string, FactNode>;
  relationships: Map<string, RelationshipEdge>;
}

// L3 Vector Memory Types
export interface VectorMetadata extends Timestamp, AccessMetrics, ImportanceScore {
  doc_id: string;
  source_session_id: string;
  content_type: 'summary' | 'insight' | 'event';
  tags: string[];
}

export interface VectorMemoryFragment {
  id: string;
  embedding: number[];
  content: string;
  metadata: VectorMetadata;
  similarity_score?: number;
}

export interface VectorMemory {
  fragments: VectorMemoryFragment[];
  dimension: number;
  index_size: number;
}

// Memory Layer Retrieval Results
export interface L1RetrievalResult {
  turns: WorkingMemoryTurn[];
  relevance_score: number;
  token_count: number;
}

export interface L2RetrievalResult {
  characters: Character[];
  facts: FactNode[];
  relationships: RelationshipEdge[];
  relevance_score: number;
  token_count: number;
}

export interface L3RetrievalResult {
  fragments: VectorMemoryFragment[];
  relevance_score: number;
  token_count: number;
}

export interface MemoryRetrievalResult {
  l1: L1RetrievalResult;
  l2: L2RetrievalResult;
  l3: L3RetrievalResult;
  fusion_weights: {
    w_L1: number;
    w_L2: number;
    w_L3: number;
  };
  final_score: number;
  total_tokens: number;
}

// L2 Write Result Interfaces
export interface FactWriteResult {
  operations: MemoryOperation[];
  fact_ids: string[];
}

export interface RelationshipWriteResult {
  operations: MemoryOperation[];
  relationship_ids: string[];
}

