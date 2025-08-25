import { mapNodeToFact } from '../mapping/fact.js';
export async function retrieveRelevantFacts(tx, query) {
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
        const node = record.get('f');
        return mapNodeToFact(node);
    });
}
