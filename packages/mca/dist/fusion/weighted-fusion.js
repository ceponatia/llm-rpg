/**
 * WeightedMemoryFusion - Combines results from all memory layers
 * Formula: FinalScore = (w_L1 * R_L1 + w_L2 * R_L2 + w_L3 * R_L3) * Importance * Decay
 */
export class WeightedMemoryFusion {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Combine retrieval results from all memory layers using weighted fusion
     */
    combineResults(l1Result, l2Result, l3Result, weights) {
        // Calculate weighted relevance scores
        const weightedL1 = l1Result.relevance_score * weights.w_L1;
        const weightedL2 = l2Result.relevance_score * weights.w_L2;
        const weightedL3 = l3Result.relevance_score * weights.w_L3;
        // Apply importance and decay factors
        const importanceFactor = this.calculateImportanceFactor(l1Result, l2Result, l3Result);
        const decayFactor = this.calculateDecayFactor(l1Result, l2Result, l3Result);
        // Final fusion score
        const final_score = (weightedL1 + weightedL2 + weightedL3) * importanceFactor * decayFactor;
        // Calculate total token count
        const total_tokens = l1Result.token_count + l2Result.token_count + l3Result.token_count;
        return {
            l1: l1Result,
            l2: l2Result,
            l3: l3Result,
            fusion_weights: weights,
            final_score: Math.min(1.0, final_score), // Clamp to max 1.0
            total_tokens
        };
    }
    /**
     * Estimate token cost for given fusion weights without actual retrieval
     */
    estimateTokenCost(sampleL1Count, sampleL2Count, sampleL3Count, weights) {
        // Rough estimation based on typical token counts per item
        const l1Tokens = sampleL1Count * 50 * weights.w_L1; // ~50 tokens per turn
        const l2Tokens = sampleL2Count * 35 * weights.w_L2; // ~35 tokens per fact/char/rel
        const l3Tokens = sampleL3Count * 100 * weights.w_L3; // ~100 tokens per fragment
        return Math.ceil(l1Tokens + l2Tokens + l3Tokens);
    }
    calculateImportanceFactor(l1Result, l2Result, l3Result) {
        let totalImportance = 0;
        let itemCount = 0;
        // L1 importance (recent conversations are inherently important)
        if (l1Result.turns.length > 0) {
            totalImportance += 0.8; // High base importance for working memory
            itemCount += 1;
        }
        // L2 importance (based on fact importance scores)
        l2Result.facts.forEach(fact => {
            totalImportance += Math.min(1.0, fact.importance_score / 10); // Normalize 0-10 to 0-1
            itemCount += 1;
        });
        // L3 importance (based on metadata)
        l3Result.fragments.forEach(fragment => {
            totalImportance += Math.min(1.0, fragment.metadata.importance_score / 10);
            itemCount += 1;
        });
        // Return average importance, with a minimum baseline
        return itemCount > 0 ?
            Math.max(0.3, totalImportance / itemCount) :
            0.3; // Minimum importance factor
    }
    calculateDecayFactor(l1Result, l2Result, l3Result) {
        const now = Date.now();
        let totalDecayScore = 0;
        let itemCount = 0;
        // L1 decay (working memory is recent, so minimal decay)
        if (l1Result.turns.length > 0) {
            l1Result.turns.forEach(turn => {
                const age = now - new Date(turn.timestamp).getTime();
                const decayScore = Math.exp(-age / (24 * 60 * 60 * 1000 * this.config.importance_decay_rate)); // Decay over days
                totalDecayScore += Math.max(0.5, decayScore); // Minimum 0.5 for recent memory
                itemCount += 1;
            });
        }
        // L2 decay (graph memory decays more slowly)
        const processL2Items = (items) => {
            items.forEach(item => {
                const age = now - new Date(item.last_updated).getTime();
                const decayScore = Math.exp(-age / (7 * 24 * 60 * 60 * 1000 * this.config.importance_decay_rate)); // Decay over weeks
                totalDecayScore += Math.max(0.2, decayScore);
                itemCount += 1;
            });
        };
        processL2Items(l2Result.characters);
        processL2Items(l2Result.facts);
        processL2Items(l2Result.relationships);
        // L3 decay (semantic memory can be older but still relevant)
        l3Result.fragments.forEach(fragment => {
            const age = now - new Date(fragment.metadata.created_at).getTime();
            const lastAccess = now - new Date(fragment.metadata.last_accessed).getTime();
            // Combine creation age and access recency
            const creationDecay = Math.exp(-age / (30 * 24 * 60 * 60 * 1000 * this.config.importance_decay_rate)); // Decay over months
            const accessBoost = Math.min(this.config.access_boost_factor, 1 + Math.log(fragment.metadata.access_count + 1) * 0.1);
            const recentAccessBoost = lastAccess < 7 * 24 * 60 * 60 * 1000 ? this.config.recency_boost_factor : 1; // Recent access bonus
            const decayScore = creationDecay * accessBoost * recentAccessBoost;
            totalDecayScore += Math.max(0.1, Math.min(1.0, decayScore));
            itemCount += 1;
        });
        // Return average decay factor, with a minimum baseline
        return itemCount > 0 ?
            Math.max(0.2, totalDecayScore / itemCount) :
            0.5; // Default decay factor when no items
    }
    /**
     * Optimize fusion weights based on query type and historical performance
     */
    optimizeWeights(queryType, baseWeights) {
        switch (queryType) {
            case 'recent':
                // Emphasize working memory for recent conversations
                return {
                    w_L1: Math.min(1.0, baseWeights.w_L1 * 1.5),
                    w_L2: baseWeights.w_L2 * 0.8,
                    w_L3: baseWeights.w_L3 * 0.7
                };
            case 'factual':
                // Emphasize graph memory for factual queries
                return {
                    w_L1: baseWeights.w_L1 * 0.7,
                    w_L2: Math.min(1.0, baseWeights.w_L2 * 1.4),
                    w_L3: baseWeights.w_L3 * 0.9
                };
            case 'semantic':
                // Emphasize vector memory for semantic/conceptual queries
                return {
                    w_L1: baseWeights.w_L1 * 0.6,
                    w_L2: baseWeights.w_L2 * 0.9,
                    w_L3: Math.min(1.0, baseWeights.w_L3 * 1.6)
                };
            default:
                return baseWeights;
        }
    }
    /**
     * Analyze query to determine optimal strategy
     */
    analyzeQuery(queryText) {
        const lowerQuery = queryText.toLowerCase();
        // Keywords that suggest recent conversation context
        const recentKeywords = ['just', 'recently', 'earlier', 'before', 'said', 'told', 'mentioned'];
        if (recentKeywords.some(keyword => lowerQuery.includes(keyword))) {
            return 'recent';
        }
        // Keywords that suggest factual information
        const factualKeywords = ['what', 'who', 'when', 'where', 'how', 'is', 'are', 'does', 'did'];
        if (factualKeywords.some(keyword => lowerQuery.startsWith(keyword))) {
            return 'factual';
        }
        // Keywords that suggest semantic/conceptual queries
        const semanticKeywords = ['like', 'similar', 'related', 'about', 'regarding', 'concerning'];
        if (semanticKeywords.some(keyword => lowerQuery.includes(keyword))) {
            return 'semantic';
        }
        // Default to balanced approach
        return 'factual';
    }
}
