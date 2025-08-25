// Maps Neo4j fact nodes to FactNode interface
import type { FactNode } from '@rpg/types';

export function mapNodeToFact(node: { properties: { id: string; entity: string; attribute: string; current_value: string; importance_score: number; created_at: { toString(): string }; last_updated?: { toString(): string } } }): FactNode {
  const properties = node.properties;
  return {
    id: properties.id,
    entity: properties.entity,
    attribute: properties.attribute,
    current_value: properties.current_value,
    history: [], // TODO: Implement version history
    importance_score: properties.importance_score,
  created_at: properties.created_at.toString(),
  last_updated: properties.last_updated?.toString() ?? properties.created_at.toString()
  };
}