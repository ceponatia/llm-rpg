// Handles conversation turn storage in Neo4j graph
import type { ManagedTransaction } from 'neo4j-driver';
import type { WorkingMemoryTurn } from '@rpg/types';

export async function storeTurn(
  tx: ManagedTransaction, 
  turn: WorkingMemoryTurn, 
  sessionId: string, 
  significanceScore: number
): Promise<void> {
  const query = `
    MERGE (s:Session {id: $sessionId})
    ON CREATE SET s.created_at = datetime()
    ON MATCH SET s.last_updated = datetime()
    
    CREATE (t:Turn {
      id: $turnId,
      role: $role,
      content: $content,
      timestamp: datetime($timestamp),
      tokens: $tokens,
      significance_score: $significanceScore,
      session_id: $sessionId
    })
    
    CREATE (s)-[:HAS_TURN]->(t)
    RETURN t
  `;

  await tx.run(query, {
    sessionId,
    turnId: turn.id,
    role: turn.role,
    content: turn.content,
    timestamp: turn.timestamp,
    tokens: turn.tokens,
    significanceScore
  });
}