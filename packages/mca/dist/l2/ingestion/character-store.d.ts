import type { ManagedTransaction } from 'neo4j-driver';
import type { VADState } from '@rpg/types';
export declare function upsertCharacter(tx: ManagedTransaction, characterId: string, vadState: VADState): Promise<void>;
