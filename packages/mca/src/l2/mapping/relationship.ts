// Maps Neo4j relationship records to RelationshipEdge interface
import { RelationshipEdge } from '@rpg/types';

interface Neo4jRecordLike { get(key: string): unknown }

export function mapRecordToRelationship(record: Neo4jRecordLike): RelationshipEdge {
  const relNode = record.get('r') as { properties: { id: string; relationship_type: string; strength: number; created_at: { toString(): string }; last_updated?: { toString(): string } } };
  const rel = relNode.properties;
  const fromId = record.get('fromId') as string;
  const toId = record.get('toId') as string;
  return {
    id: rel.id,
    from_entity: fromId,
    to_entity: toId,
    relationship_type: rel.relationship_type,
    strength: rel.strength,
    created_at: rel.created_at.toString(),
    last_updated: rel.last_updated?.toString() || rel.created_at.toString()
  };
}