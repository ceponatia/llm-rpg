// Maps Neo4j character nodes to Character interface
import { Character } from '@rpg/types';

export function mapNodeToCharacter(node: { properties: { id: string; name: string; emotional_state?: { valence: number; arousal: number; dominance: number }; created_at: { toString(): string }; last_updated?: { toString(): string } } }): Character {
  const properties = node.properties;
  return {
    id: properties.id,
    name: properties.name,
    type: 'Character' as const,
    emotional_state: properties.emotional_state || { valence: 0, arousal: 0, dominance: 0 },
    created_at: properties.created_at.toString(),
    last_updated: properties.last_updated?.toString() || properties.created_at.toString()
  };
}