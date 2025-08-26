import type { VADState, Timestamp, AccessMetrics, ImportanceScore, MemoryOperation } from './common.js';
export interface WorkingMemoryTurn {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    tokens: number;
    character_id?: string;
}
export interface WorkingMemory {
    turns: Array<WorkingMemoryTurn>;
    max_turns: number;
    total_tokens: number;
}
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
    history: Array<FactVersion>;
    importance_score: number;
}
export interface RelationshipEdge extends Timestamp {
    id: string;
    from_entity: string;
    to_entity: string;
    relationship_type: string;
    strength: number;
    emotional_context?: VADState;
}
export interface GraphMemory {
    characters: Map<string, Character>;
    facts: Map<string, FactNode>;
    relationships: Map<string, RelationshipEdge>;
}
export interface VectorMetadata extends Timestamp, AccessMetrics, ImportanceScore {
    doc_id: string;
    source_session_id: string;
    content_type: 'summary' | 'insight' | 'event';
    tags: Array<string>;
}
export interface VectorMemoryFragment {
    id: string;
    embedding: Array<number>;
    content: string;
    metadata: VectorMetadata;
    similarity_score?: number;
}
export interface VectorMemory {
    fragments: Array<VectorMemoryFragment>;
    dimension: number;
    index_size: number;
}
export interface L1RetrievalResult {
    turns: Array<WorkingMemoryTurn>;
    relevance_score: number;
    token_count: number;
}
export interface L2RetrievalResult {
    characters: Array<Character>;
    facts: Array<FactNode>;
    relationships: Array<RelationshipEdge>;
    relevance_score: number;
    token_count: number;
}
export interface L3RetrievalResult {
    fragments: Array<VectorMemoryFragment>;
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
export interface FactWriteResult {
    operations: Array<MemoryOperation>;
    fact_ids: Array<string>;
}
export interface RelationshipWriteResult {
    operations: Array<MemoryOperation>;
    relationship_ids: Array<string>;
}
