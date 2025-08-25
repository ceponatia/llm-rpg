import { z } from "zod";
export declare const workingMemoryTurnSchema: z.ZodObject<{
    id: z.ZodString;
    role: z.ZodUnion<readonly [z.ZodLiteral<"user">, z.ZodLiteral<"assistant">, z.ZodLiteral<"system">]>;
    content: z.ZodString;
    timestamp: z.ZodString;
    tokens: z.ZodNumber;
    character_id: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const workingMemorySchema: z.ZodObject<{
    turns: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        role: z.ZodUnion<readonly [z.ZodLiteral<"user">, z.ZodLiteral<"assistant">, z.ZodLiteral<"system">]>;
        content: z.ZodString;
        timestamp: z.ZodString;
        tokens: z.ZodNumber;
        character_id: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    max_turns: z.ZodNumber;
    total_tokens: z.ZodNumber;
}, z.core.$strip>;
export declare const characterSchema: z.ZodObject<{
    created_at: z.ZodString;
    last_updated: z.ZodString;
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodLiteral<"Character">;
    emotional_state: z.ZodObject<{
        valence: z.ZodNumber;
        arousal: z.ZodNumber;
        dominance: z.ZodNumber;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const factVersionSchema: z.ZodObject<{
    value: z.ZodString;
    timestamp: z.ZodString;
    confidence: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const factNodeSchema: z.ZodObject<{
    created_at: z.ZodString;
    last_updated: z.ZodString;
    id: z.ZodString;
    entity: z.ZodString;
    attribute: z.ZodString;
    current_value: z.ZodString;
    history: z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        timestamp: z.ZodString;
        confidence: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    importance_score: z.ZodNumber;
}, z.core.$strip>;
export declare const relationshipEdgeSchema: z.ZodObject<{
    created_at: z.ZodString;
    last_updated: z.ZodString;
    id: z.ZodString;
    from_entity: z.ZodString;
    to_entity: z.ZodString;
    relationship_type: z.ZodString;
    strength: z.ZodNumber;
    emotional_context: z.ZodOptional<z.ZodObject<{
        valence: z.ZodNumber;
        arousal: z.ZodNumber;
        dominance: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const vectorMetadataSchema: z.ZodObject<{
    created_at: z.ZodString;
    last_updated: z.ZodString;
    last_accessed: z.ZodString;
    access_count: z.ZodNumber;
    importance_score: z.ZodNumber;
    doc_id: z.ZodString;
    source_session_id: z.ZodString;
    content_type: z.ZodUnion<readonly [z.ZodLiteral<"summary">, z.ZodLiteral<"insight">, z.ZodLiteral<"event">]>;
    tags: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const vectorMemoryFragmentSchema: z.ZodObject<{
    id: z.ZodString;
    embedding: z.ZodArray<z.ZodNumber>;
    content: z.ZodString;
    metadata: z.ZodObject<{
        created_at: z.ZodString;
        last_updated: z.ZodString;
        last_accessed: z.ZodString;
        access_count: z.ZodNumber;
        importance_score: z.ZodNumber;
        doc_id: z.ZodString;
        source_session_id: z.ZodString;
        content_type: z.ZodUnion<readonly [z.ZodLiteral<"summary">, z.ZodLiteral<"insight">, z.ZodLiteral<"event">]>;
        tags: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
    similarity_score: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const vectorMemorySchema: z.ZodObject<{
    fragments: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        embedding: z.ZodArray<z.ZodNumber>;
        content: z.ZodString;
        metadata: z.ZodObject<{
            created_at: z.ZodString;
            last_updated: z.ZodString;
            last_accessed: z.ZodString;
            access_count: z.ZodNumber;
            importance_score: z.ZodNumber;
            doc_id: z.ZodString;
            source_session_id: z.ZodString;
            content_type: z.ZodUnion<readonly [z.ZodLiteral<"summary">, z.ZodLiteral<"insight">, z.ZodLiteral<"event">]>;
            tags: z.ZodArray<z.ZodString>;
        }, z.core.$strip>;
        similarity_score: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    dimension: z.ZodNumber;
    index_size: z.ZodNumber;
}, z.core.$strip>;
export declare const l1RetrievalResultSchema: z.ZodObject<{
    turns: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        role: z.ZodUnion<readonly [z.ZodLiteral<"user">, z.ZodLiteral<"assistant">, z.ZodLiteral<"system">]>;
        content: z.ZodString;
        timestamp: z.ZodString;
        tokens: z.ZodNumber;
        character_id: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    relevance_score: z.ZodNumber;
    token_count: z.ZodNumber;
}, z.core.$strip>;
export declare const l2RetrievalResultSchema: z.ZodObject<{
    characters: z.ZodArray<z.ZodObject<{
        created_at: z.ZodString;
        last_updated: z.ZodString;
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodLiteral<"Character">;
        emotional_state: z.ZodObject<{
            valence: z.ZodNumber;
            arousal: z.ZodNumber;
            dominance: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>>;
    facts: z.ZodArray<z.ZodObject<{
        created_at: z.ZodString;
        last_updated: z.ZodString;
        id: z.ZodString;
        entity: z.ZodString;
        attribute: z.ZodString;
        current_value: z.ZodString;
        history: z.ZodArray<z.ZodObject<{
            value: z.ZodString;
            timestamp: z.ZodString;
            confidence: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        importance_score: z.ZodNumber;
    }, z.core.$strip>>;
    relationships: z.ZodArray<z.ZodObject<{
        created_at: z.ZodString;
        last_updated: z.ZodString;
        id: z.ZodString;
        from_entity: z.ZodString;
        to_entity: z.ZodString;
        relationship_type: z.ZodString;
        strength: z.ZodNumber;
        emotional_context: z.ZodOptional<z.ZodObject<{
            valence: z.ZodNumber;
            arousal: z.ZodNumber;
            dominance: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    relevance_score: z.ZodNumber;
    token_count: z.ZodNumber;
}, z.core.$strip>;
export declare const l3RetrievalResultSchema: z.ZodObject<{
    fragments: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        embedding: z.ZodArray<z.ZodNumber>;
        content: z.ZodString;
        metadata: z.ZodObject<{
            created_at: z.ZodString;
            last_updated: z.ZodString;
            last_accessed: z.ZodString;
            access_count: z.ZodNumber;
            importance_score: z.ZodNumber;
            doc_id: z.ZodString;
            source_session_id: z.ZodString;
            content_type: z.ZodUnion<readonly [z.ZodLiteral<"summary">, z.ZodLiteral<"insight">, z.ZodLiteral<"event">]>;
            tags: z.ZodArray<z.ZodString>;
        }, z.core.$strip>;
        similarity_score: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    relevance_score: z.ZodNumber;
    token_count: z.ZodNumber;
}, z.core.$strip>;
export declare const memoryRetrievalResultSchema: z.ZodObject<{
    l1: z.ZodObject<{
        turns: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            role: z.ZodUnion<readonly [z.ZodLiteral<"user">, z.ZodLiteral<"assistant">, z.ZodLiteral<"system">]>;
            content: z.ZodString;
            timestamp: z.ZodString;
            tokens: z.ZodNumber;
            character_id: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        relevance_score: z.ZodNumber;
        token_count: z.ZodNumber;
    }, z.core.$strip>;
    l2: z.ZodObject<{
        characters: z.ZodArray<z.ZodObject<{
            created_at: z.ZodString;
            last_updated: z.ZodString;
            id: z.ZodString;
            name: z.ZodString;
            type: z.ZodLiteral<"Character">;
            emotional_state: z.ZodObject<{
                valence: z.ZodNumber;
                arousal: z.ZodNumber;
                dominance: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>>;
        facts: z.ZodArray<z.ZodObject<{
            created_at: z.ZodString;
            last_updated: z.ZodString;
            id: z.ZodString;
            entity: z.ZodString;
            attribute: z.ZodString;
            current_value: z.ZodString;
            history: z.ZodArray<z.ZodObject<{
                value: z.ZodString;
                timestamp: z.ZodString;
                confidence: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
            importance_score: z.ZodNumber;
        }, z.core.$strip>>;
        relationships: z.ZodArray<z.ZodObject<{
            created_at: z.ZodString;
            last_updated: z.ZodString;
            id: z.ZodString;
            from_entity: z.ZodString;
            to_entity: z.ZodString;
            relationship_type: z.ZodString;
            strength: z.ZodNumber;
            emotional_context: z.ZodOptional<z.ZodObject<{
                valence: z.ZodNumber;
                arousal: z.ZodNumber;
                dominance: z.ZodNumber;
            }, z.core.$strip>>;
        }, z.core.$strip>>;
        relevance_score: z.ZodNumber;
        token_count: z.ZodNumber;
    }, z.core.$strip>;
    l3: z.ZodObject<{
        fragments: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            embedding: z.ZodArray<z.ZodNumber>;
            content: z.ZodString;
            metadata: z.ZodObject<{
                created_at: z.ZodString;
                last_updated: z.ZodString;
                last_accessed: z.ZodString;
                access_count: z.ZodNumber;
                importance_score: z.ZodNumber;
                doc_id: z.ZodString;
                source_session_id: z.ZodString;
                content_type: z.ZodUnion<readonly [z.ZodLiteral<"summary">, z.ZodLiteral<"insight">, z.ZodLiteral<"event">]>;
                tags: z.ZodArray<z.ZodString>;
            }, z.core.$strip>;
            similarity_score: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        relevance_score: z.ZodNumber;
        token_count: z.ZodNumber;
    }, z.core.$strip>;
    fusion_weights: z.ZodObject<{
        w_L1: z.ZodNumber;
        w_L2: z.ZodNumber;
        w_L3: z.ZodNumber;
    }, z.core.$strip>;
    final_score: z.ZodNumber;
    total_tokens: z.ZodNumber;
}, z.core.$strip>;
export declare const factWriteResultSchema: z.ZodObject<{
    operations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodUnion<readonly [z.ZodLiteral<"read">, z.ZodLiteral<"write">, z.ZodLiteral<"update">, z.ZodLiteral<"delete">]>;
        layer: z.ZodUnion<readonly [z.ZodLiteral<"L1">, z.ZodLiteral<"L2">, z.ZodLiteral<"L3">]>;
        operation: z.ZodString;
        timestamp: z.ZodString;
        duration_ms: z.ZodNumber;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>;
    fact_ids: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const relationshipWriteResultSchema: z.ZodObject<{
    operations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodUnion<readonly [z.ZodLiteral<"read">, z.ZodLiteral<"write">, z.ZodLiteral<"update">, z.ZodLiteral<"delete">]>;
        layer: z.ZodUnion<readonly [z.ZodLiteral<"L1">, z.ZodLiteral<"L2">, z.ZodLiteral<"L3">]>;
        operation: z.ZodString;
        timestamp: z.ZodString;
        duration_ms: z.ZodNumber;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>;
    relationship_ids: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
