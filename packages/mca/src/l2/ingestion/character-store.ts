// Handles character upsertion into Neo4j graph
import type { ManagedTransaction } from 'neo4j-driver';
import type { VADState } from '@rpg/types';

export async function upsertCharacter(
  tx: ManagedTransaction, 
  characterId: string, 
  vadState: VADState
): Promise<void> {
  const query = `
    MERGE (c:Character {id: $characterId})
    ON CREATE SET 
      c.name = $name,
      c.type = 'Character',
      c.created_at = datetime(),
      c.emotional_state = $vadState
    ON MATCH SET 
      c.last_updated = datetime(),
      c.emotional_state = $vadState
    RETURN c
  `;

  const name = characterId.replace('character:', '');
  await tx.run(query, { 
    characterId, 
    name, 
    vadState: {
      valence: vadState.valence,
      arousal: vadState.arousal,
      dominance: vadState.dominance
    }
  });
}