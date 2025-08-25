export interface VADState {
    valence: number;
    arousal: number;
    dominance: number;
}
export interface Timestamp {
    created_at: string;
    last_updated: string;
}
export interface AccessMetrics {
    last_accessed: string;
    access_count: number;
}
export interface ImportanceScore {
    importance_score: number;
}
export interface WeightedMemoryFusion {
    w_L1: number;
    w_L2: number;
    w_L3: number;
}
export interface TokenCost {
    total_tokens: number;
    l1_tokens: number;
    l2_tokens: number;
    l3_tokens: number;
    estimated_cost: number;
}
export interface MemoryOperation {
    id: string;
    type: 'read' | 'write' | 'update' | 'delete';
    layer: 'L1' | 'L2' | 'L3';
    operation: string;
    timestamp: string;
    duration_ms: number;
    details?: Record<string, unknown>;
}
