import { Character } from '@rpg/types';
export declare function mapNodeToCharacter(node: {
    properties: {
        id: string;
        name: string;
        emotional_state?: {
            valence: number;
            arousal: number;
            dominance: number;
        };
        created_at: {
            toString(): string;
        };
        last_updated?: {
            toString(): string;
        };
    };
}): Character;
