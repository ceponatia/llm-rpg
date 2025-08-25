/**
 * Token counting utilities for memory management
 */
export declare class TokenCounter {
    /**
     * Estimate token count for text (approximation: 4 characters per token)
     */
    static estimateTokens(text: string): number;
    /**
     * Estimate tokens for structured data objects
     */
    static estimateObjectTokens(obj: unknown): number;
    /**
     * Calculate cost based on token count (mock pricing)
     */
    static estimateCost(tokens: number, model?: string): number;
    /**
     * Truncate text to fit within token limit
     */
    static truncateToTokenLimit(text: string, maxTokens: number): string;
    /**
     * Batch process multiple texts and return token counts
     */
    static batchEstimate(texts: string[]): {
        text: string;
        tokens: number;
    }[];
}
