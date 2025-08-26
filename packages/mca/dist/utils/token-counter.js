/**
 * Token counting utilities for memory management
 * Converted from static class to plain functions to satisfy no-extraneous-class.
 */
export function estimateTokens(text) {
    if (text.length === 0) {
        return 0;
    }
    // More sophisticated estimation considering:
    // - Whitespace doesn't count as much
    // - Punctuation is often separate tokens
    // - Average English word is ~4.5 characters
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const punctuationMatch = text.match(/[.,!?;:"'()-]/g);
    const punctuation = punctuationMatch !== null ? punctuationMatch.length : 0;
    // Rough estimation: 0.75 tokens per word + punctuation tokens
    return Math.ceil(words.length * 0.75 + punctuation);
}
export function estimateObjectTokens(obj) {
    if (typeof obj === 'string') {
        return estimateTokens(obj);
    }
    if (typeof obj === 'number' || typeof obj === 'boolean') {
        return 1;
    }
    if (Array.isArray(obj)) {
        return obj.reduce((sum, item) => sum + estimateObjectTokens(item), 0);
    }
    if (typeof obj === 'object' && obj !== null) {
        let tokens = 2; // Opening and closing braces
        for (const [key, value] of Object.entries(obj)) {
            tokens += estimateTokens(key); // Property name
            tokens += estimateObjectTokens(value); // Property value
            tokens += 1; // Separator/colon
        }
        return tokens;
    }
    return 0;
}
export function estimateCost(tokens, model = 'mistral') {
    const costPerToken = {
        mistral: 0.0001,
        'gpt-3.5': 0.0015,
        'gpt-4': 0.03
    };
    const cost = costPerToken[model] ?? costPerToken.mistral;
    return tokens * cost;
}
export function truncateToTokenLimit(text, maxTokens) {
    const estimatedTokens = estimateTokens(text);
    if (estimatedTokens <= maxTokens) {
        return text;
    }
    const charLimit = Math.floor((maxTokens / estimatedTokens) * text.length);
    const truncated = text.substring(0, charLimit);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > charLimit * 0.8) {
        return truncated.substring(0, lastSpace) + '...';
    }
    return truncated + '...';
}
export function batchEstimate(texts) {
    return texts.map(text => ({ text, tokens: estimateTokens(text) }));
}
// Backwards compatibility aggregate (kept lightweight)
export const TokenCounter = {
    estimateTokens,
    estimateObjectTokens,
    estimateCost,
    truncateToTokenLimit,
    batchEstimate
};
