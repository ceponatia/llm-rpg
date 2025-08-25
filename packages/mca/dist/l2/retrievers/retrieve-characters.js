import { mapNodeToCharacter } from '../mapping/character.js';
export async function retrieveRelevantCharacters(tx, query) {
    const cypherQuery = `
    MATCH (c:Character)
    WHERE toLower(c.name) CONTAINS toLower($queryText)
    RETURN c
    ORDER BY c.last_updated DESC
    LIMIT 10
  `;
    const result = await tx.run(cypherQuery, { queryText: query.query_text });
    return result.records.map(record => {
        const node = record.get('c');
        return mapNodeToCharacter(node);
    });
}
