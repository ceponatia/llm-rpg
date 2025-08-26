import type { MCAConfig, WorkingMemoryTurn, L2RetrievalResult, MemoryRetrievalQuery, Character, FactNode, EventDetectionResult, MemoryOperation } from '@rpg/types';
import type { IDatabaseManager } from '../interfaces/database.js';
/**
 * L2 Graph Memory - Episodic & Emotional Graph using Neo4j
 * Stores structured "who, what, when" with VAD emotional states
 */
export declare class L2GraphMemory {
    private readonly dbManager;
    private readonly config;
    private readonly driver;
    constructor(dbManager: IDatabaseManager, config: MCAConfig);
    /**
     * Ingest a conversation turn into the graph memory
     */
    ingestTurn(turn: WorkingMemoryTurn, eventDetection: EventDetectionResult, sessionId: string): Promise<{
        operations: Array<MemoryOperation>;
        facts_updated: Array<string>;
        relationships_modified: Array<string>;
    }>;
    /**
     * Retrieve relevant context from graph memory
     */
    retrieve(query: MemoryRetrievalQuery): Promise<L2RetrievalResult>;
    getAllCharacters(): Promise<Array<Character>>;
    getEmotionalHistory(): Promise<Array<unknown>>;
    getFactWithHistory(factId: string): Promise<FactNode | null>;
    inspect(): Promise<{
        characters: number;
        facts: number;
        relationships: number;
        conversation_turns: number;
    }>;
    getStatistics(): Promise<{
        characters: number;
        facts: number;
        relationships: number;
        conversation_turns: number;
    }>;
}
