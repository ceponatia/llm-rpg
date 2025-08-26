export function mapRecordToRelationship(record) {
    const relNode = record.get('r');
    const rel = relNode.properties;
    const fromId = record.get('fromId');
    const toId = record.get('toId');
    return {
        id: rel.id,
        from_entity: fromId,
        to_entity: toId,
        relationship_type: rel.relationship_type,
        strength: rel.strength,
        created_at: rel.created_at.toString(),
        last_updated: rel.last_updated?.toString() ?? rel.created_at.toString()
    };
}
