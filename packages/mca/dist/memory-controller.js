// DatabaseManager will be passed as a parameter
import { L1WorkingMemory } from './layers/l1-working-memory.js';
import { L2GraphMemory } from './layers/l2-graph-memory.js';
import { L3VectorMemory } from './layers/l3-vector-memory.js';
import { SignificanceScorer } from './scoring/significance-scorer.js';
import { WeightedMemoryFusion as MemoryFusion } from './fusion/weighted-fusion.js';
export class MemoryController {
    dbManager;
    config;
    l1;
    l2;
    l3;
    scorer;
    fusion;
    constructor(dbManager, config) {
        this.dbManager = dbManager;
        this.config = config;
        this.l1 = new L1WorkingMemory(config);
        this.l2 = new L2GraphMemory(dbManager, config);
        this.l3 = new L3VectorMemory(dbManager, config);
        this.scorer = new SignificanceScorer(config);
        this.fusion = new MemoryFusion(config);
    }
    /**
     * WRITE PATH: Ingest a conversation turn into memory
     */
    async ingestConversationTurn(turn, context, sessionId) {
        const operations = [];
        try {
            // 1. Always add to L1 (working memory)
            this.l1.addTurn(sessionId, turn);
            operations.push({
                id: crypto.randomUUID(),
                type: 'write',
                layer: 'L1',
                operation: 'addTurn',
                timestamp: new Date().toISOString(),
                duration_ms: 0,
                details: { turn_id: turn.id, session_id: sessionId }
            });
            // 2. Score the turn for significance
            const significanceScore = this.scorer.scoreConversationTurn(turn, context);
            const eventDetection = this.scorer.detectEvents(turn, context);
            // 3. If significant enough, process for L2 and L3
            let factsUpdated = [];
            let relationshipsModified = [];
            const emotionalChanges = eventDetection.emotional_changes;
            if (eventDetection.is_significant) {
                // Process for L2 (graph memory)
                const l2Result = await this.l2.ingestTurn(turn, eventDetection, sessionId);
                operations.push(...l2Result.operations);
                factsUpdated = l2Result.facts_updated;
                relationshipsModified = l2Result.relationships_modified;
                // Process for L3 (vector memory) if it's a summary-worthy event
                if (significanceScore >= this.config.l2_significance_threshold * 1.5) {
                    const l3Result = await this.l3.ingestTurn(turn, eventDetection, sessionId);
                    operations.push(...l3Result.operations);
                }
            }
            // 4. Autonomous state management (if enabled)
            await this.manageMemoryState(sessionId);
            return {
                success: true,
                operations_performed: operations,
                significance_score: significanceScore,
                events_detected: eventDetection.detected_events,
                emotional_changes: emotionalChanges,
                facts_updated: factsUpdated,
                relationships_modified: relationshipsModified
            };
        }
        catch (error) {
            console.error('Memory ingestion failed:', error);
            return {
                success: false,
                operations_performed: operations,
                significance_score: 0,
                events_detected: [],
                emotional_changes: [],
                facts_updated: [],
                relationships_modified: []
            };
        }
    }
    /**
     * READ PATH: Retrieve relevant context using weighted memory fusion
     */
    async retrieveRelevantContext(query) {
        try {
            const [l1Result, l2Result, l3Result] = await Promise.all([
                this.l1.retrieve(query),
                this.l2.retrieve(query),
                this.l3.retrieve(query)
            ]);
            const fusedResult = this.fusion.combineResults(l1Result, l2Result, l3Result, query.fusion_weights);
            return fusedResult;
        }
        catch (error) {
            console.error('Memory retrieval failed:', error);
            return {
                l1: { turns: [], relevance_score: 0, token_count: 0 },
                l2: { characters: [], facts: [], relationships: [], relevance_score: 0, token_count: 0 },
                l3: { fragments: [], relevance_score: 0, token_count: 0 },
                fusion_weights: query.fusion_weights,
                final_score: 0,
                total_tokens: 0
            };
        }
    }
    /**
     * Autonomous state management - runs after every write operation
     */
    async manageMemoryState(sessionId) {
        // This will be implemented in Phase 3 (Advanced Agent Logic)
        // For now, just log that state management was called
        console.log(`Memory state management triggered for session: ${sessionId}`);
    }
    /**
     * PUBLIC API METHODS
     */
    async getChatHistory(sessionId) {
        return this.l1.getHistory(sessionId);
    }
    async getAllSessions() {
        return this.l1.getAllSessions();
    }
    async getAllCharacters() {
        return this.l2.getAllCharacters();
    }
    async getCharacterEmotionalHistory() {
        return this.l2.getEmotionalHistory();
    }
    async getFactWithHistory(factId) {
        return this.l2.getFactWithHistory(factId);
    }
    async searchMemory(query, options) {
        const searchQuery = {
            query_text: query,
            session_id: 'search',
            fusion_weights: this.config.default_fusion_weights,
            max_tokens: options.limit * 100
        };
        return await this.retrieveRelevantContext(searchQuery);
    }
    async inspectMemoryState() {
        const [l1State, l2State, l3State] = await Promise.all([
            this.l1.inspect(),
            this.l2.inspect(),
            this.l3.inspect()
        ]);
        return {
            l1_working_memory: l1State,
            l2_graph_memory: l2State,
            l3_vector_memory: l3State,
            config: this.config,
            timestamp: new Date().toISOString()
        };
    }
    async getMemoryStatistics() {
        const [l1Stats, l2Stats, l3Stats] = await Promise.all([
            this.l1.getStatistics(),
            this.l2.getStatistics(),
            this.l3.getStatistics()
        ]);
        return {
            l1_stats: l1Stats,
            l2_stats: l2Stats,
            l3_stats: l3Stats,
            total_sessions: l1Stats.total_sessions,
            timestamp: new Date().toISOString()
        };
    }
    async pruneMemory() {
        return { message: 'Pruning not yet implemented' };
    }
    async estimateTokenCost(query) {
        const result = await this.retrieveRelevantContext(query);
        return {
            total_tokens: result.total_tokens,
            l1_tokens: result.l1.token_count,
            l2_tokens: result.l2.token_count,
            l3_tokens: result.l3.token_count,
            estimated_cost: result.total_tokens * 0.0001 // Mock cost calculation
        };
    }
    // Configuration update methods
    updateFusionWeights(weights) {
        this.config.default_fusion_weights = weights;
    }
    updateSignificanceThreshold(threshold) {
        this.config.l2_significance_threshold = threshold;
    }
}
