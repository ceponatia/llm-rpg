/**
 * Text processing utilities for memory operations (converted from static class to functions)
 */
export declare function cleanText(text: string): string;
export declare function extractKeywords(text: string, minLength?: number): Array<string>;
export declare function calculateSimilarity(text1: string, text2: string): number;
export declare function generateSummary(text: string, maxLength?: number): string;
export declare function detectSentiment(text: string): {
    polarity: number;
    confidence: number;
};
export declare function extractPotentialNames(text: string): Array<string>;
export declare function containsQuestion(text: string): boolean;
export declare function hasStrongEmotion(text: string): boolean;
export declare function normalizeEntityName(name: string): string;
export declare const TextUtils: {
    readonly cleanText: typeof cleanText;
    readonly extractKeywords: typeof extractKeywords;
    readonly calculateSimilarity: typeof calculateSimilarity;
    readonly generateSummary: typeof generateSummary;
    readonly detectSentiment: typeof detectSentiment;
    readonly extractPotentialNames: typeof extractPotentialNames;
    readonly containsQuestion: typeof containsQuestion;
    readonly hasStrongEmotion: typeof hasStrongEmotion;
    readonly normalizeEntityName: typeof normalizeEntityName;
};
