import { z } from "zod";
export declare const webSocketMessageSchema: z.ZodObject<{
    type: z.ZodUnion<readonly [z.ZodLiteral<"subscribe_to_memory_operations">, z.ZodLiteral<"subscribe_to_emotional_changes">, z.ZodLiteral<"ping">, z.ZodLiteral<"memory_search">]>;
    data: z.ZodOptional<z.ZodObject<{
        query: z.ZodOptional<z.ZodString>;
        options: z.ZodOptional<z.ZodObject<{
            limit: z.ZodOptional<z.ZodNumber>;
            k: z.ZodOptional<z.ZodNumber>;
            threshold: z.ZodOptional<z.ZodNumber>;
            includeMetadata: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    timestamp: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const webSocketResponseSchema: z.ZodObject<{
    type: z.ZodUnion<readonly [z.ZodLiteral<"connection_established">, z.ZodLiteral<"subscription_confirmed">, z.ZodLiteral<"pong">, z.ZodLiteral<"error">, z.ZodLiteral<"memory_operation_update">, z.ZodLiteral<"emotional_change_update">]>;
    subscription: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
    data: z.ZodOptional<z.ZodUnknown>;
}, z.core.$strip>;
