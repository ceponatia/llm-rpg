import type { ManagedTransaction } from 'neo4j-driver';
import type { MemoryRetrievalQuery, FactNode } from '@rpg/types';
export declare function retrieveRelevantFacts(tx: ManagedTransaction, query: MemoryRetrievalQuery): Promise<Array<FactNode>>;
