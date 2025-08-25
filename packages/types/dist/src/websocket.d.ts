export interface WebSocketMessage {
    type: "subscribe_to_memory_operations" | "subscribe_to_emotional_changes" | "ping" | "memory_search";
    data?: {
        query?: string;
        options?: {
            limit?: number;
            k?: number;
            threshold?: number;
            includeMetadata?: boolean;
        };
    };
    timestamp?: string;
}
export interface WebSocketResponse {
    type: "connection_established" | "subscription_confirmed" | "pong" | "error" | "memory_operation_update" | "emotional_change_update";
    subscription?: string;
    message?: string;
    timestamp: string;
    data?: unknown;
}
