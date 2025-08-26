import type { MCAConfig, WorkingMemoryTurn, L3RetrievalResult, MemoryRetrievalQuery, EventDetectionResult, MemoryOperation } from '@rpg/types';
import type { IDatabaseManager } from '../interfaces/database.js';
/**
 * L3 Vector Memory - Semantic Archive using FAISS
 * Stores embeddings of hierarchically-generated summaries and insights
 */
export declare class L3VectorMemory {
    private readonly dbManager;
    private readonly config;
    private readonly fragments;
    constructor(dbManager: IDatabaseManager, config: MCAConfig);
    /**
     * Ingest a conversation turn into vector memory
     */
    ingestTurn(turn: WorkingMemoryTurn, eventDetection: EventDetectionResult, sessionId: string): Promise<{
        operations: Array<MemoryOperation>;
    }>;
    /**
     * Retrieve relevant fragments from vector memory
     */
    retrieve(query: MemoryRetrievalQuery): L3RetrievalResult;
    private generateSummary;
    private generateEmbedding;
    private determineContentType;
    private extractTags;
    private estimateL3TokenCount;
    /**
     * Public API methods
     */
    inspect(): unknown;
    getStatistics(): unknown;
    /**
     * Prune old or low-importance fragments
     */
    pruneFragments(maxFragments?: number): void;
    private calculateCompositeScore;
}
