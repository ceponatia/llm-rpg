// Handles fact assertion and storage into Neo4j graph
import { ManagedTransaction } from 'neo4j-driver';
import { WorkingMemoryTurn } from '@rpg/types';
import { MemoryOperation } from '@rpg/types';

export interface FactWriteResult {
  operations: MemoryOperation[];
  fact_ids: string[];
}

export async function processFact(
  tx: ManagedTransaction, 
  event: { entities_involved: string[]; description: string; confidence: number }, 
  turn: WorkingMemoryTurn, 
  sessionId: string
): Promise<FactWriteResult> {
  // Extract fact information from the event
  // This is a simplified implementation - in reality, we'd use NLP
  const factId = `fact:${crypto.randomUUID()}`;
  const operations: MemoryOperation[] = [];
  
  // For now, create a simple fact from the event description
  const query = `
    CREATE (f:Fact {
      id: $factId,
      entity: $entity,
      attribute: $attribute,
      current_value: $value,
      created_at: datetime(),
      last_updated: datetime(),
      importance_score: $importance,
      session_id: $sessionId,
      turn_id: $turnId
    })
    RETURN f
  `;

  await tx.run(query, {
    factId,
    entity: event.entities_involved[0] || 'unknown',
    attribute: 'description',
    value: event.description,
    importance: event.confidence * 10,
    sessionId,
    turnId: turn.id
  });

  operations.push({
    id: crypto.randomUUID(),
    type: 'write',
    layer: 'L2',
    operation: 'createFact',
    timestamp: new Date().toISOString(),
    duration_ms: 0,
    details: { fact_id: factId }
  });

  return { operations, fact_ids: [factId] };
}