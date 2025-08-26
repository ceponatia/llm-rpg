export function calculateL2RelevanceScore(characters, facts, relationships) {
    const totalItems = characters.length + facts.length + relationships.length;
    if (totalItems === 0) {
        return 0;
    }
    // Simple relevance calculation based on matches
    return Math.min(1.0, totalItems / 10); // Normalized to max of 1.0
}
export function estimateL2TokenCount(characters, facts, relationships) {
    let tokenCount = 0;
    // Rough estimation: 50 tokens per character, 30 per fact, 25 per relationship
    tokenCount += characters.length * 50;
    tokenCount += facts.length * 30;
    tokenCount += relationships.length * 25;
    return tokenCount;
}
