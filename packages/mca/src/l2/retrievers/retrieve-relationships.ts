// Retrieves relevant relationships from Neo4j graph based on query
import type { ManagedTransaction } from 'neo4j-driver';
import type { RelationshipEdge, MemoryRetrievalQuery } from '@rpg/types';
import { mapRecordToRelationship } from '../mapping/relationship.js';

interface Neo4jRecordLike { get(key: string): unknown }

export async function retrieveRelevantRelationships(
  tx: ManagedTransaction, 
  query: MemoryRetrievalQuery
): Promise<Array<RelationshipEdge>> {
  const cypherQuery = `
    MATCH (from)-[r:RELATIONSHIP]->(to)
    WHERE toLower(r.relationship_type) CONTAINS toLower($queryText)
       OR toLower(from.name) CONTAINS toLower($queryText)
       OR toLower(to.name) CONTAINS toLower($queryText)
    RETURN r, from.id as fromId, to.id as toId
    ORDER BY r.strength DESC, r.last_updated DESC
    LIMIT 10
  `;

  const result = await tx.run(cypherQuery, { queryText: query.query_text });
  return result.records.map(record => mapRecordToRelationship(record as Neo4jRecordLike));
}