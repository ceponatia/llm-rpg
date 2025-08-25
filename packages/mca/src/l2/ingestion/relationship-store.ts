// Handles relationship creation and updates in Neo4j graph
import type { ManagedTransaction } from 'neo4j-driver';
import type { WorkingMemoryTurn, MemoryOperation } from '@rpg/types';

export interface RelationshipWriteResult {
  operations: Array<MemoryOperation>;
  relationship_ids: Array<string>;
}

export async function processRelationship(
  tx: ManagedTransaction, 
  event: { entities_involved: Array<string>; type: string; confidence: number }, 
  turn: WorkingMemoryTurn, 
  sessionId: string
): Promise<RelationshipWriteResult> {
  if (event.entities_involved.length < 2) {
    return { operations: [], relationship_ids: [] };
  }

  const relationshipId = `rel:${crypto.randomUUID()}`;
  const operations: Array<MemoryOperation> = [];

  const query = `
    MATCH (from:Character {id: $fromEntity})
    MATCH (to:Character {id: $toEntity})
    CREATE (from)-[r:RELATIONSHIP {
      id: $relationshipId,
      relationship_type: $relType,
      strength: $strength,
      created_at: datetime(),
      last_updated: datetime(),
      session_id: $sessionId,
      turn_id: $turnId
    }]->(to)
    RETURN r
  `;

  await tx.run(query, {
    relationshipId,
    fromEntity: event.entities_involved[0],
    toEntity: event.entities_involved[1],
    relType: event.type,
    strength: event.confidence,
    sessionId,
    turnId: turn.id
  });

  operations.push({
    id: crypto.randomUUID(),
    type: 'write',
    layer: 'L2',
    operation: 'createRelationship',
    timestamp: new Date().toISOString(),
    duration_ms: 0,
    details: { relationship_id: relationshipId }
  });

  return { operations, relationship_ids: [relationshipId] };
}