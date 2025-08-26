/**
 * Text processing utilities for memory operations (converted from static class to functions)
 */
export function cleanText(text) {
    return text
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s.,!?;:'"()-]/g, '')
        .toLowerCase();
}
export function extractKeywords(text, minLength = 3) {
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'between', 'among', 'underneath',
        'beside', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
        'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
        'his', 'her', 'its', 'our', 'their', 'am', 'is', 'are', 'was', 'were',
        'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can'
    ]);
    const words = cleanText(text)
        .split(/\s+/)
        .filter(word => word.length >= minLength &&
        !stopWords.has(word) &&
        !/^\d+$/.test(word) // Exclude pure numbers
    );
    // Count word frequencies
    const wordCounts = new Map();
    words.forEach(word => {
        const current = wordCounts.get(word);
        wordCounts.set(word, (current ?? 0) + 1);
    });
    // Return words sorted by frequency (most common first)
    return Array.from(wordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => word);
}
export function calculateSimilarity(text1, text2) {
    const words1 = new Set(extractKeywords(text1));
    const words2 = new Set(extractKeywords(text2));
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    if (union.size === 0) {
        return 0;
    }
    return intersection.size / union.size;
}
export function generateSummary(text, maxLength = 200) {
    if (text.length <= maxLength) {
        return text;
    }
    // Try to cut at sentence boundaries
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    let summary = '';
    for (const sentence of sentences) {
        const testSummary = summary + sentence + '. ';
        if (testSummary.length > maxLength) {
            break;
        }
        summary = testSummary;
    }
    if (summary.length === 0) {
        // Fallback: cut at word boundary
        const words = text.split(' ');
        let wordSummary = '';
        for (const word of words) {
            const testSummary = wordSummary + word + ' ';
            if (testSummary.length > maxLength - 3) {
                break;
            }
            wordSummary = testSummary;
        }
        summary = wordSummary.trim() + '...';
    }
    return summary.trim();
}
export function detectSentiment(text) {
    const positiveWords = [
        'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love',
        'like', 'enjoy', 'happy', 'pleased', 'satisfied', 'perfect', 'awesome'
    ];
    const negativeWords = [
        'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'angry',
        'frustrated', 'disappointed', 'sad', 'upset', 'annoyed', 'disgusted'
    ];
    const cleanedText = cleanText(text);
    const words = cleanedText.split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    words.forEach(word => {
        if (positiveWords.includes(word)) {
            positiveCount++;
        }
        if (negativeWords.includes(word)) {
            negativeCount++;
        }
    });
    const totalSentimentWords = positiveCount + negativeCount;
    if (totalSentimentWords === 0) {
        return { polarity: 0, confidence: 0 };
    }
    const polarity = (positiveCount - negativeCount) / totalSentimentWords;
    const confidence = totalSentimentWords / words.length;
    return { polarity, confidence };
}
export function extractPotentialNames(text) {
    // Look for capitalized words that could be names
    const capitalizedWordsMatch = text.match(/\b[A-Z][a-z]+\b/g);
    const capitalizedWords = capitalizedWordsMatch ?? [];
    // Filter out common words that start with capitals
    const commonCapitalized = new Set([
        'The', 'This', 'That', 'These', 'Those', 'I', 'We', 'You', 'He', 'She',
        'It', 'They', 'My', 'Your', 'His', 'Her', 'Our', 'Their', 'Monday',
        'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
        'January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'
    ]);
    return capitalizedWords
        .filter(word => !commonCapitalized.has(word))
        .filter((word, index, array) => array.indexOf(word) === index); // Remove duplicates
}
export function containsQuestion(text) {
    return /\?/.test(text) || /^(what|who|when|where|why|how|is|are|do|does|did|can|could|would|will|should)/i.test(text.trim());
}
export function hasStrongEmotion(text) {
    return /!{2,}/.test(text) || /\b[A-Z]{3,}\b/.test(text) || /[!?]{3,}/.test(text);
}
export function normalizeEntityName(name) {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '_');
}
// Backwards compatibility namespace-like export
export const TextUtils = {
    cleanText,
    extractKeywords,
    calculateSimilarity,
    generateSummary,
    detectSentiment,
    extractPotentialNames,
    containsQuestion,
    hasStrongEmotion,
    normalizeEntityName
};
