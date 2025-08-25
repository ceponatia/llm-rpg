import { MCAConfig, WorkingMemoryTurn, L3RetrievalResult, MemoryRetrievalQuery, EventDetectionResult, MemoryOperation } from '@rpg/types';
import { IDatabaseManager } from '../interfaces/database.js';
/**
 * L3 Vector Memory - Semantic Archive using FAISS
 * Stores embeddings of hierarchically-generated summaries and insights
 */
export declare class L3VectorMemory {
    private dbManager;
    private config;
    private fragments;
    private nextIndex;
    constructor(dbManager: IDatabaseManager, config: MCAConfig);
    /**
     * Ingest a conversation turn into vector memory
     */
    ingestTurn(turn: WorkingMemoryTurn, eventDetection: EventDetectionResult, sessionId: string): Promise<{
        operations: MemoryOperation[];
    }>;
    /**
     * Retrieve relevant fragments from vector memory
     */
    retrieve(query: MemoryRetrievalQuery): Promise<L3RetrievalResult>;
    private generateSummary;
    private generateEmbedding;
    private determineContentType;
    private extractTags;
    private estimateL3TokenCount;
    /**
     * Public API methods
     */
    inspect(): Promise<unknown>;
    getStatistics(): Promise<unknown>;
    /**
     * Prune old or low-importance fragments
     */
    pruneFragments(maxFragments?: number): Promise<void>;
    private calculateCompositeScore;
}
