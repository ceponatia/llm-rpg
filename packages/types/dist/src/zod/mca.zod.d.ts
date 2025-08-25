import { z } from "zod";
export declare const mCAConfigSchema: z.ZodObject<{
    l1_max_turns: z.ZodNumber;
    l1_max_tokens: z.ZodNumber;
    l2_significance_threshold: z.ZodNumber;
    l2_emotional_delta_threshold: z.ZodNumber;
    l3_vector_dimension: z.ZodNumber;
    l3_max_fragments: z.ZodNumber;
    default_fusion_weights: z.ZodObject<{
        w_L1: z.ZodNumber;
        w_L2: z.ZodNumber;
        w_L3: z.ZodNumber;
    }, z.core.$strip>;
    importance_decay_rate: z.ZodNumber;
    access_boost_factor: z.ZodNumber;
    recency_boost_factor: z.ZodNumber;
}, z.core.$strip>;
export declare const detectedEventSchema: z.ZodObject<{
    type: z.ZodUnion<readonly [z.ZodLiteral<"relationship_change">, z.ZodLiteral<"fact_assertion">, z.ZodLiteral<"emotional_peak">, z.ZodLiteral<"conflict">, z.ZodLiteral<"resolution">]>;
    confidence: z.ZodNumber;
    description: z.ZodString;
    entities_involved: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const emotionalChangeSchema: z.ZodObject<{
    character_id: z.ZodString;
    previous_vad: z.ZodObject<{
        valence: z.ZodNumber;
        arousal: z.ZodNumber;
        dominance: z.ZodNumber;
    }, z.core.$strip>;
    new_vad: z.ZodObject<{
        valence: z.ZodNumber;
        arousal: z.ZodNumber;
        dominance: z.ZodNumber;
    }, z.core.$strip>;
    delta_magnitude: z.ZodNumber;
    trigger: z.ZodString;
}, z.core.$strip>;
export declare const namedEntitySchema: z.ZodObject<{
    text: z.ZodString;
    type: z.ZodUnion<readonly [z.ZodLiteral<"PERSON">, z.ZodLiteral<"PLACE">, z.ZodLiteral<"OBJECT">, z.ZodLiteral<"CONCEPT">]>;
    confidence: z.ZodNumber;
    start_pos: z.ZodNumber;
    end_pos: z.ZodNumber;
}, z.core.$strip>;
export declare const significanceScorerSchema: z.ZodObject<{}, z.core.$strip>;
export declare const memoryIngestionResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    operations_performed: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodUnion<readonly [z.ZodLiteral<"read">, z.ZodLiteral<"write">, z.ZodLiteral<"update">, z.ZodLiteral<"delete">]>;
        layer: z.ZodUnion<readonly [z.ZodLiteral<"L1">, z.ZodLiteral<"L2">, z.ZodLiteral<"L3">]>;
        operation: z.ZodString;
        timestamp: z.ZodString;
        duration_ms: z.ZodNumber;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>;
    significance_score: z.ZodNumber;
    events_detected: z.ZodArray<z.ZodObject<{
        type: z.ZodUnion<readonly [z.ZodLiteral<"relationship_change">, z.ZodLiteral<"fact_assertion">, z.ZodLiteral<"emotional_peak">, z.ZodLiteral<"conflict">, z.ZodLiteral<"resolution">]>;
        confidence: z.ZodNumber;
        description: z.ZodString;
        entities_involved: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    emotional_changes: z.ZodArray<z.ZodObject<{
        character_id: z.ZodString;
        previous_vad: z.ZodObject<{
            valence: z.ZodNumber;
            arousal: z.ZodNumber;
            dominance: z.ZodNumber;
        }, z.core.$strip>;
        new_vad: z.ZodObject<{
            valence: z.ZodNumber;
            arousal: z.ZodNumber;
            dominance: z.ZodNumber;
        }, z.core.$strip>;
        delta_magnitude: z.ZodNumber;
        trigger: z.ZodString;
    }, z.core.$strip>>;
    facts_updated: z.ZodArray<z.ZodString>;
    relationships_modified: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const memoryRetrievalQuerySchema: z.ZodObject<{
    query_text: z.ZodString;
    session_id: z.ZodString;
    fusion_weights: z.ZodObject<{
        w_L1: z.ZodNumber;
        w_L2: z.ZodNumber;
        w_L3: z.ZodNumber;
    }, z.core.$strip>;
    max_tokens: z.ZodOptional<z.ZodNumber>;
    min_relevance_threshold: z.ZodOptional<z.ZodNumber>;
    character_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const conflictResolutionPolicySchema: z.ZodObject<{
    strategy: z.ZodUnion<readonly [z.ZodLiteral<"latest_wins">, z.ZodLiteral<"highest_confidence">, z.ZodLiteral<"versioned_history">, z.ZodLiteral<"user_prompt">]>;
    confidence_threshold: z.ZodNumber;
    max_versions_per_fact: z.ZodNumber;
}, z.core.$strip>;
export declare const pruningPolicySchema: z.ZodObject<{
    enable_pruning: z.ZodBoolean;
    prune_threshold_score: z.ZodNumber;
    max_age_days: z.ZodNumber;
    preserve_high_importance: z.ZodBoolean;
    archive_before_delete: z.ZodBoolean;
}, z.core.$strip>;
export declare const eventDetectionResultSchema: z.ZodObject<{
    is_significant: z.ZodBoolean;
    significance_score: z.ZodNumber;
    detected_events: z.ZodArray<z.ZodObject<{
        type: z.ZodUnion<readonly [z.ZodLiteral<"relationship_change">, z.ZodLiteral<"fact_assertion">, z.ZodLiteral<"emotional_peak">, z.ZodLiteral<"conflict">, z.ZodLiteral<"resolution">]>;
        confidence: z.ZodNumber;
        description: z.ZodString;
        entities_involved: z.ZodArray<z.ZodString>;
    }, z.core.$strip>>;
    emotional_changes: z.ZodArray<z.ZodObject<{
        character_id: z.ZodString;
        previous_vad: z.ZodObject<{
            valence: z.ZodNumber;
            arousal: z.ZodNumber;
            dominance: z.ZodNumber;
        }, z.core.$strip>;
        new_vad: z.ZodObject<{
            valence: z.ZodNumber;
            arousal: z.ZodNumber;
            dominance: z.ZodNumber;
        }, z.core.$strip>;
        delta_magnitude: z.ZodNumber;
        trigger: z.ZodString;
    }, z.core.$strip>>;
    named_entities: z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        type: z.ZodUnion<readonly [z.ZodLiteral<"PERSON">, z.ZodLiteral<"PLACE">, z.ZodLiteral<"OBJECT">, z.ZodLiteral<"CONCEPT">]>;
        confidence: z.ZodNumber;
        start_pos: z.ZodNumber;
        end_pos: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
