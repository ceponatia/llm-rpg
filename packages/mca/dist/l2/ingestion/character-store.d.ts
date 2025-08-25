import { ManagedTransaction } from 'neo4j-driver';
import { VADState } from '@rpg/types';
export declare function upsertCharacter(tx: ManagedTransaction, characterId: string, vadState: VADState): Promise<void>;
