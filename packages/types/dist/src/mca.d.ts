import type { VADState, MemoryOperation } from './common.js';
import type { WorkingMemoryTurn } from './memory.js';
export interface MCAConfig {
    l1_max_turns: number;
    l1_max_tokens: number;
    l2_significance_threshold: number;
    l2_emotional_delta_threshold: number;
    l3_vector_dimension: number;
    l3_max_fragments: number;
    default_fusion_weights: {
        w_L1: number;
        w_L2: number;
        w_L3: number;
    };
    importance_decay_rate: number;
    access_boost_factor: number;
    recency_boost_factor: number;
}
export interface EventDetectionResult {
    is_significant: boolean;
    significance_score: number;
    detected_events: Array<DetectedEvent>;
    emotional_changes: Array<EmotionalChange>;
    named_entities: Array<NamedEntity>;
}
export interface DetectedEvent {
    type: 'relationship_change' | 'fact_assertion' | 'emotional_peak' | 'conflict' | 'resolution';
    confidence: number;
    description: string;
    entities_involved: Array<string>;
}
export interface EmotionalChange {
    character_id: string;
    previous_vad: VADState;
    new_vad: VADState;
    delta_magnitude: number;
    trigger: string;
}
export interface NamedEntity {
    text: string;
    type: 'PERSON' | 'PLACE' | 'OBJECT' | 'CONCEPT';
    confidence: number;
    start_pos: number;
    end_pos: number;
}
export interface SignificanceScorer {
    scoreConversationTurn(turn: WorkingMemoryTurn, context: Array<WorkingMemoryTurn>): number;
    detectEvents(turn: WorkingMemoryTurn, context: Array<WorkingMemoryTurn>): EventDetectionResult;
    calculateVADDelta(current: VADState, previous: VADState): number;
}
export interface MemoryIngestionResult {
    success: boolean;
    operations_performed: Array<MemoryOperation>;
    significance_score: number;
    events_detected: Array<DetectedEvent>;
    emotional_changes: Array<EmotionalChange>;
    facts_updated: Array<string>;
    relationships_modified: Array<string>;
}
export interface MemoryRetrievalQuery {
    query_text: string;
    session_id: string;
    fusion_weights: {
        w_L1: number;
        w_L2: number;
        w_L3: number;
    };
    max_tokens?: number;
    min_relevance_threshold?: number;
    character_id?: string;
}
export interface ConflictResolutionPolicy {
    strategy: 'latest_wins' | 'highest_confidence' | 'versioned_history' | 'user_prompt';
    confidence_threshold: number;
    max_versions_per_fact: number;
}
export interface PruningPolicy {
    enable_pruning: boolean;
    prune_threshold_score: number;
    max_age_days: number;
    preserve_high_importance: boolean;
    archive_before_delete: boolean;
}
