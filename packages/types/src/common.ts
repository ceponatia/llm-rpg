export interface VADState {
  valence: number;    // -1 to 1 (negative to positive emotions)
  arousal: number;    // 0 to 1 (calm to excited)
  dominance: number;  // 0 to 1 (submissive to dominant)
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
  importance_score: number; // 0-10 scale
}

export interface WeightedMemoryFusion {
  w_L1: number; // Weight for L1 working memory
  w_L2: number; // Weight for L2 episodic/emotional graph  
  w_L3: number; // Weight for L3 semantic archive
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