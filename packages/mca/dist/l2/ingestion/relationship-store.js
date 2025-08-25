export async function processRelationship(tx, event, turn, sessionId) {
    if (event.entities_involved.length < 2) {
        return { operations: [], relationship_ids: [] };
    }
    const relationshipId = `rel:${crypto.randomUUID()}`;
    const operations = [];
    const query = `
    MATCH (from:Character {id: $fromEntity})
    MATCH (to:Character {id: $toEntity})
    CREATE (from)-[r:RELATIONSHIP {
      id: $relationshipId,
      relationship_type: $relType,
      strength: $strength,
      created_at: datetime(),
      last_updated: datetime(),
      session_id: $sessionId,
      turn_id: $turnId
    }]->(to)
    RETURN r
  `;
    await tx.run(query, {
        relationshipId,
        fromEntity: event.entities_involved[0],
        toEntity: event.entities_involved[1],
        relType: event.type,
        strength: event.confidence,
        sessionId,
        turnId: turn.id
    });
    operations.push({
        id: crypto.randomUUID(),
        type: 'write',
        layer: 'L2',
        operation: 'createRelationship',
        timestamp: new Date().toISOString(),
        duration_ms: 0,
        details: { relationship_id: relationshipId }
    });
    return { operations, relationship_ids: [relationshipId] };
}
