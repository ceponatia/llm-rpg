import type { Character, FactNode, RelationshipEdge } from '@rpg/types';
export declare function calculateL2RelevanceScore(characters: Array<Character>, facts: Array<FactNode>, relationships: Array<RelationshipEdge>): number;
export declare function estimateL2TokenCount(characters: Array<Character>, facts: Array<FactNode>, relationships: Array<RelationshipEdge>): number;
