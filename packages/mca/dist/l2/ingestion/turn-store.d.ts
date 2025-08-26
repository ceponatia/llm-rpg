import type { ManagedTransaction } from 'neo4j-driver';
import type { WorkingMemoryTurn } from '@rpg/types';
export declare function storeTurn(tx: ManagedTransaction, turn: WorkingMemoryTurn, sessionId: string, significanceScore: number): Promise<void>;
