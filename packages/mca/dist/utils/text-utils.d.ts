/**
 * Text processing utilities for memory operations
 */
export declare class TextUtils {
    /**
     * Clean and normalize text for processing
     */
    static cleanText(text: string): string;
    /**
     * Extract keywords from text
     */
    static extractKeywords(text: string, minLength?: number): string[];
    /**
     * Calculate text similarity using simple Jaccard coefficient
     */
    static calculateSimilarity(text1: string, text2: string): number;
    /**
     * Generate a summary of text (simple truncation with sentence boundary detection)
     */
    static generateSummary(text: string, maxLength?: number): string;
    /**
     * Detect the sentiment/tone of text (simple keyword-based)
     */
    static detectSentiment(text: string): {
        polarity: number;
        confidence: number;
    };
    /**
     * Extract potential character names from text
     */
    static extractPotentialNames(text: string): string[];
    /**
     * Check if text contains a question
     */
    static containsQuestion(text: string): boolean;
    /**
     * Check if text expresses strong emotion
     */
    static hasStrongEmotion(text: string): boolean;
    /**
     * Normalize entity names for consistent storage
     */
    static normalizeEntityName(name: string): string;
}
