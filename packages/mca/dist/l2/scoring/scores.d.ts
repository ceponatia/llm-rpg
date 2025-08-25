import { Character, FactNode, RelationshipEdge } from '@rpg/types';
export declare function calculateL2RelevanceScore(characters: Character[], facts: FactNode[], relationships: RelationshipEdge[]): number;
export declare function estimateL2TokenCount(characters: Character[], facts: FactNode[], relationships: RelationshipEdge[]): number;
