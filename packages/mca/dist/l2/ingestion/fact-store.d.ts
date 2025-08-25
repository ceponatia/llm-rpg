import { ManagedTransaction } from 'neo4j-driver';
import { WorkingMemoryTurn } from '@rpg/types';
import { MemoryOperation } from '@rpg/types';
export interface FactWriteResult {
    operations: MemoryOperation[];
    fact_ids: string[];
}
export declare function processFact(tx: ManagedTransaction, event: {
    entities_involved: string[];
    description: string;
    confidence: number;
}, turn: WorkingMemoryTurn, sessionId: string): Promise<FactWriteResult>;
