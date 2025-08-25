import { ManagedTransaction } from 'neo4j-driver';
import { RelationshipEdge, MemoryRetrievalQuery } from '@rpg/types';
export declare function retrieveRelevantRelationships(tx: ManagedTransaction, query: MemoryRetrievalQuery): Promise<RelationshipEdge[]>;
