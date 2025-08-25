import { ManagedTransaction } from 'neo4j-driver';
import { MemoryRetrievalQuery, FactNode } from '@rpg/types';
export declare function retrieveRelevantFacts(tx: ManagedTransaction, query: MemoryRetrievalQuery): Promise<FactNode[]>;
