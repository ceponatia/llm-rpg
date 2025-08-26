import type { ManagedTransaction } from 'neo4j-driver';
import type { WorkingMemoryTurn, MemoryOperation } from '@rpg/types';
export interface FactWriteResult {
    operations: Array<MemoryOperation>;
    fact_ids: Array<string>;
}
export declare function processFact(tx: ManagedTransaction, event: {
    entities_involved: Array<string>;
    description: string;
    confidence: number;
}, turn: WorkingMemoryTurn, sessionId: string): Promise<FactWriteResult>;
