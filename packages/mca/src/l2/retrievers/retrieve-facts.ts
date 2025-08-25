// Retrieves relevant facts from Neo4j graph based on query
import type { ManagedTransaction } from 'neo4j-driver';
import type { MemoryRetrievalQuery, FactNode } from '@rpg/types';
import { mapNodeToFact } from '../mapping/fact.js';

interface Neo4jNode { properties: { id: string; entity: string; attribute: string; current_value: string; importance_score: number; created_at: { toString(): string }; last_updated?: { toString(): string } } }

export async function retrieveRelevantFacts(
  tx: ManagedTransaction,
  query: MemoryRetrievalQuery
): Promise<Array<FactNode>> {
  const cypherQuery = `
    MATCH (f:Fact)
    WHERE toLower(f.attribute) CONTAINS toLower($queryText)
       OR toLower(f.current_value) CONTAINS toLower($queryText)
       OR toLower(f.entity) CONTAINS toLower($queryText)
    RETURN f
    ORDER BY f.last_updated DESC
    LIMIT 25
  `;

  const result = await tx.run(cypherQuery, { queryText: query.query_text });
  return result.records.map(record => {
    const node = record.get('f') as Neo4jNode;
    return mapNodeToFact(node);
  });
}