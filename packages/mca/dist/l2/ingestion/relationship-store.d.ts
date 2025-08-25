import { ManagedTransaction } from 'neo4j-driver';
import { WorkingMemoryTurn } from '@rpg/types';
import { MemoryOperation } from '@rpg/types';
export interface RelationshipWriteResult {
    operations: MemoryOperation[];
    relationship_ids: string[];
}
export declare function processRelationship(tx: ManagedTransaction, event: {
    entities_involved: string[];
    type: string;
    confidence: number;
}, turn: WorkingMemoryTurn, sessionId: string): Promise<RelationshipWriteResult>;
