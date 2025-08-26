import type { ManagedTransaction } from 'neo4j-driver';
import type { RelationshipEdge, MemoryRetrievalQuery } from '@rpg/types';
export declare function retrieveRelevantRelationships(tx: ManagedTransaction, query: MemoryRetrievalQuery): Promise<Array<RelationshipEdge>>;
