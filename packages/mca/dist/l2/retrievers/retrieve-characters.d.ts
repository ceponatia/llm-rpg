import type { ManagedTransaction } from 'neo4j-driver';
import type { Character, MemoryRetrievalQuery } from '@rpg/types';
export declare function retrieveRelevantCharacters(tx: ManagedTransaction, query: MemoryRetrievalQuery): Promise<Array<Character>>;
