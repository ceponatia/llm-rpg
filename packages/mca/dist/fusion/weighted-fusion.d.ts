import type { L1RetrievalResult, L2RetrievalResult, L3RetrievalResult, MemoryRetrievalResult, WeightedMemoryFusion as FusionWeights, MCAConfig } from '@rpg/types';
/**
 * WeightedMemoryFusion - Combines results from all memory layers
 * Formula: FinalScore = (w_L1 * R_L1 + w_L2 * R_L2 + w_L3 * R_L3) * Importance * Decay
 */
export declare class WeightedMemoryFusion {
    private readonly config;
    constructor(config: MCAConfig);
    /**
     * Combine retrieval results from all memory layers using weighted fusion
     */
    combineResults(l1Result: L1RetrievalResult, l2Result: L2RetrievalResult, l3Result: L3RetrievalResult, weights: FusionWeights): MemoryRetrievalResult;
    /**
     * Estimate token cost for given fusion weights without actual retrieval
     */
    estimateTokenCost(sampleL1Count: number, sampleL2Count: number, sampleL3Count: number, weights: FusionWeights): number;
    private calculateImportanceFactor;
    private calculateDecayFactor;
    /**
     * Optimize fusion weights based on query type and historical performance
     */
    optimizeWeights(queryType: 'recent' | 'factual' | 'semantic', baseWeights: FusionWeights): FusionWeights;
    /**
     * Analyze query to determine optimal strategy
     */
    analyzeQuery(queryText: string): 'recent' | 'factual' | 'semantic';
}
