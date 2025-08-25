import { ManagedTransaction } from 'neo4j-driver';
import { Character, MemoryRetrievalQuery } from '@rpg/types';
export declare function retrieveRelevantCharacters(tx: ManagedTransaction, query: MemoryRetrievalQuery): Promise<Character[]>;
