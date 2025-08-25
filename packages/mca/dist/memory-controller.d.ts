import { MCAConfig, MemoryRetrievalQuery, MemoryRetrievalResult, MemoryIngestionResult, WorkingMemoryTurn, WeightedMemoryFusion, ChatSession, Character, FactNode, TokenCost } from '@rpg/types';
import { IDatabaseManager } from './interfaces/database.js';
export declare class MemoryController {
    private dbManager;
    config: MCAConfig;
    private l1;
    private l2;
    private l3;
    private scorer;
    private fusion;
    constructor(dbManager: IDatabaseManager, config: MCAConfig);
    /**
     * WRITE PATH: Ingest a conversation turn into memory
     */
    ingestConversationTurn(turn: WorkingMemoryTurn, context: WorkingMemoryTurn[], sessionId: string): Promise<MemoryIngestionResult>;
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
    getChatHistory(sessionId: string): Promise<WorkingMemoryTurn[]>;
    getAllSessions(): Promise<ChatSession[]>;
    getAllCharacters(): Promise<Character[]>;
    getCharacterEmotionalHistory(): Promise<unknown[]>;
    getFactWithHistory(factId: string): Promise<FactNode | null>;
    searchMemory(query: string, options: {
        limit: number;
    }): Promise<MemoryRetrievalResult>;
    inspectMemoryState(): Promise<unknown>;
    getMemoryStatistics(): Promise<unknown>;
    pruneMemory(): Promise<{
        message: string;
    }>;
    estimateTokenCost(query: MemoryRetrievalQuery): Promise<TokenCost>;
    updateFusionWeights(weights: WeightedMemoryFusion): void;
    updateSignificanceThreshold(threshold: number): void;
}
