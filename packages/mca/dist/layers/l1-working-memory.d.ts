import { MCAConfig, WorkingMemoryTurn, L1RetrievalResult, MemoryRetrievalQuery, ChatSession } from '@rpg/types';
/**
 * L1 Working Memory - Ephemeral session-based buffer
 * Holds the last N conversational turns for immediate context
 */
export declare class L1WorkingMemory {
    private config;
    private sessions;
    constructor(config: MCAConfig);
    /**
     * Add a new turn to the working memory buffer
     */
    addTurn(sessionId: string, turn: WorkingMemoryTurn): void;
    /**
     * Retrieve relevant turns from working memory
     */
    retrieve(query: MemoryRetrievalQuery): Promise<L1RetrievalResult>;
    /**
     * Calculate relevance score for working memory turns
     */
    private calculateRelevanceScore;
    /**
     * Get chat history for a session
     */
    getHistory(sessionId: string): WorkingMemoryTurn[];
    /**
     * Get all active sessions
     */
    getAllSessions(): ChatSession[];
    /**
     * Clear old sessions to free memory
     */
    clearOldSessions(maxAge?: number): void;
    /**
     * Inspect current state
     */
    inspect(): Promise<unknown>;
    /**
     * Get statistics
     */
    getStatistics(): Promise<{
        total_sessions: number;
        total_turns: number;
        total_tokens: number;
        avg_turns_per_session: number;
        avg_tokens_per_session: number;
    }>;
}
