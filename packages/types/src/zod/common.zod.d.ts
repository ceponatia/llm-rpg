import { z } from "zod";
export declare const vADStateSchema: z.ZodObject<{
    valence: z.ZodNumber;
    arousal: z.ZodNumber;
    dominance: z.ZodNumber;
}, z.core.$strip>;
export declare const timestampSchema: z.ZodObject<{
    created_at: z.ZodString;
    last_updated: z.ZodString;
}, z.core.$strip>;
export declare const accessMetricsSchema: z.ZodObject<{
    last_accessed: z.ZodString;
    access_count: z.ZodNumber;
}, z.core.$strip>;
export declare const importanceScoreSchema: z.ZodObject<{
    importance_score: z.ZodNumber;
}, z.core.$strip>;
export declare const weightedMemoryFusionSchema: z.ZodObject<{
    w_L1: z.ZodNumber;
    w_L2: z.ZodNumber;
    w_L3: z.ZodNumber;
}, z.core.$strip>;
export declare const tokenCostSchema: z.ZodObject<{
    total_tokens: z.ZodNumber;
    l1_tokens: z.ZodNumber;
    l2_tokens: z.ZodNumber;
    l3_tokens: z.ZodNumber;
    estimated_cost: z.ZodNumber;
}, z.core.$strip>;
export declare const memoryOperationSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodUnion<readonly [z.ZodLiteral<"read">, z.ZodLiteral<"write">, z.ZodLiteral<"update">, z.ZodLiteral<"delete">]>;
    layer: z.ZodUnion<readonly [z.ZodLiteral<"L1">, z.ZodLiteral<"L2">, z.ZodLiteral<"L3">]>;
    operation: z.ZodString;
    timestamp: z.ZodString;
    duration_ms: z.ZodNumber;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
