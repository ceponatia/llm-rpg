/**
 * Token counting utilities for memory management
 * Converted from static class to plain functions to satisfy no-extraneous-class.
 */
export declare function estimateTokens(text: string): number;
export declare function estimateObjectTokens(obj: unknown): number;
export declare function estimateCost(tokens: number, model?: string): number;
export declare function truncateToTokenLimit(text: string, maxTokens: number): string;
export declare function batchEstimate(texts: Array<string>): Array<{
    text: string;
    tokens: number;
}>;
export declare const TokenCounter: {
    readonly estimateTokens: typeof estimateTokens;
    readonly estimateObjectTokens: typeof estimateObjectTokens;
    readonly estimateCost: typeof estimateCost;
    readonly truncateToTokenLimit: typeof truncateToTokenLimit;
    readonly batchEstimate: typeof batchEstimate;
};
