// Retrieves relevant characters from Neo4j graph based on query
import type { ManagedTransaction } from 'neo4j-driver';
import type { Character, MemoryRetrievalQuery } from '@rpg/types';
import { mapNodeToCharacter } from '../mapping/character.js';

interface Neo4jNode { properties: { id: string; name: string; emotional_state?: { valence: number; arousal: number; dominance: number }; created_at: { toString(): string }; last_updated?: { toString(): string } } }

export async function retrieveRelevantCharacters(
  tx: ManagedTransaction, 
  query: MemoryRetrievalQuery
): Promise<Array<Character>> {
  const cypherQuery = `
    MATCH (c:Character)
    WHERE toLower(c.name) CONTAINS toLower($queryText)
    RETURN c
    ORDER BY c.last_updated DESC
    LIMIT 10
  `;

  const result = await tx.run(cypherQuery, { queryText: query.query_text });
  return result.records.map(record => {
    const node = record.get('c') as Neo4jNode;
    return mapNodeToCharacter(node);
  });
}