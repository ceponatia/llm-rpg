import type { VADState } from './common.js';

// Structured attributes enable selective, per-turn injections (e.g., only hair_color)
export type AttributeCategory =
  | 'physical'      // hair_color, eye_color, height, foot_texture, etc.
  | 'personality'   // traits like curious, analytical, empathetic
  | 'background'    // origin, occupation, affiliations
  | 'abilities'     // skills, powers, languages
  | 'preferences'   // likes, dislikes
  | 'speech'        // tone, quirks, catchphrases
  | 'meta';         // internal/system-only notes

export type AttributePrimitive = string | number | boolean;

export interface AttributeScalar {
  value: AttributePrimitive; // e.g., "brown", 178, true
  unit?: string;             // e.g., "cm"
}

export interface CharacterAttribute {
  // Canonical key in snake_case so it's easy to match and render
  key: string;                   // e.g., "hair_color", "foot_texture"
  category: AttributeCategory;   // e.g., "physical"
  // Value can be a primitive or a scalar with unit
  value: AttributePrimitive | AttributeScalar;
  // Optional alternate terms to improve matching during retrieval
  aliases?: string[];            // e.g., ["hair", "haircolor"]
  // Optional helpers for prioritization and maintenance
  salience?: number;             // 0..1, general importance for injection
  confidence?: number;           // 0..1, confidence in correctness
  lastUpdated?: string;          // ISO timestamp
}

// UI/domain-level character definition for selection/persona purposes.
// Note: Distinct from L2 graph memory Character (see memory.ts) to avoid naming conflicts.
export interface CharacterProfile {
  id: string;            // slug or UUID
  name: string;
  description?: string;  // long-form UI copy (not used for fine-grained injection)
  avatar_url?: string;   // avatar image path/url
  baseline_vad?: VADState; // baseline emotional state

  // Structured, queryable attributes for prompt-time injection
  attributes?: CharacterAttribute[];
}
