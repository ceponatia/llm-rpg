import type { ManagedTransaction } from 'neo4j-driver';
import type { WorkingMemoryTurn, MemoryOperation } from '@rpg/types';
export interface RelationshipWriteResult {
    operations: Array<MemoryOperation>;
    relationship_ids: Array<string>;
}
export declare function processRelationship(tx: ManagedTransaction, event: {
    entities_involved: Array<string>;
    type: string;
    confidence: number;
}, turn: WorkingMemoryTurn, sessionId: string): Promise<RelationshipWriteResult>;
