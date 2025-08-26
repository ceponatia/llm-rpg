import type { MCAConfig, MemoryRetrievalQuery, MemoryRetrievalResult, MemoryIngestionResult, WorkingMemoryTurn, WeightedMemoryFusion, ChatSession, Character, FactNode, TokenCost } from '@rpg/types';
import type { IDatabaseManager } from './interfaces/database.js';
export declare class MemoryController {
    private readonly dbManager;
    config: MCAConfig;
    private readonly l1;
    private readonly l2;
    private readonly l3;
    private readonly scorer;
    private readonly fusion;
    constructor(dbManager: IDatabaseManager, config: MCAConfig);
    /**
     * WRITE PATH: Ingest a conversation turn into memory
     */
    ingestConversationTurn(turn: WorkingMemoryTurn, context: Array<WorkingMemoryTurn>, sessionId: string): Promise<MemoryIngestionResult>;
    /**
     * READ PATH: Retrieve relevant context using weighted memory fusion
     */
    retrieveRelevantContext(query: MemoryRetrievalQuery): Promise<MemoryRetrievalResult>;
    /**
     * Autonomous state management - runs after every write operation
     */
    private manageMemoryState;
    /**
     * PUBLIC API METHODS
     */
    getChatHistory(sessionId: string): Array<WorkingMemoryTurn>;
    getAllSessions(): Array<ChatSession>;
    getAllCharacters(): Promise<Array<Character>>;
    getCharacterEmotionalHistory(): Promise<Array<unknown>>;
    getFactWithHistory(factId: string): Promise<FactNode | null>;
    searchMemory(query: string, options: {
        limit: number;
    }): Promise<MemoryRetrievalResult>;
    inspectMemoryState(): Promise<unknown>;
    getMemoryStatistics(): Promise<unknown>;
    pruneMemory(): {
        message: string;
    };
    estimateTokenCost(query: MemoryRetrievalQuery): Promise<TokenCost>;
    updateFusionWeights(weights: WeightedMemoryFusion): void;
    updateSignificanceThreshold(threshold: number): void;
}
