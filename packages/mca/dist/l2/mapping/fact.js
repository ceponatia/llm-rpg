export function mapNodeToFact(node) {
    const properties = node.properties;
    return {
        id: properties.id,
        entity: properties.entity,
        attribute: properties.attribute,
        current_value: properties.current_value,
        history: [], // TODO: Implement version history
        importance_score: properties.importance_score,
        created_at: properties.created_at.toString(),
        last_updated: properties.last_updated?.toString() ?? properties.created_at.toString()
    };
}
