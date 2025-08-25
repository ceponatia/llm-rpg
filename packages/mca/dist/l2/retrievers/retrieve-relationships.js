import { mapRecordToRelationship } from '../mapping/relationship.js';
export async function retrieveRelevantRelationships(tx, query) {
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
    return result.records.map(record => mapRecordToRelationship(record));
}
