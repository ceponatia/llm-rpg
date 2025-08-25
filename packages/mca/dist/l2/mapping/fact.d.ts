import { FactNode } from '@rpg/types';
export declare function mapNodeToFact(node: {
    properties: {
        id: string;
        entity: string;
        attribute: string;
        current_value: string;
        importance_score: number;
        created_at: {
            toString(): string;
        };
        last_updated?: {
            toString(): string;
        };
    };
}): FactNode;
