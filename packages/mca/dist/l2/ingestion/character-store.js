export async function upsertCharacter(tx, characterId, vadState) {
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
