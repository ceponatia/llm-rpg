/**
 * L3 Vector Memory - Semantic Archive using FAISS
 * Stores embeddings of hierarchically-generated summaries and insights
 */
export class L3VectorMemory {
    dbManager;
    config;
    fragments = new Map();
    nextIndex = 0;
    constructor(dbManager, config) {
        this.dbManager = dbManager;
        this.config = config;
    }
    /**
     * Ingest a conversation turn into vector memory
     */
    async ingestTurn(turn, eventDetection, sessionId) {
        const operations = [];
        try {
            const summary = this.generateSummary(turn, eventDetection);
            const embedding = await this.generateEmbedding(summary);
            const fragment = {
                id: `vec:${crypto.randomUUID()}`,
                embedding,
                content: summary,
                metadata: {
                    doc_id: `doc:${crypto.randomUUID()}`,
                    source_session_id: sessionId,
                    content_type: this.determineContentType(eventDetection),
                    tags: this.extractTags(turn, eventDetection),
                    importance_score: eventDetection.significance_score,
                    created_at: new Date().toISOString(),
                    last_updated: new Date().toISOString(),
                    last_accessed: new Date().toISOString(),
                    access_count: 0
                }
            };
            const faissIndex = this.dbManager.getFaissIndex();
            faissIndex.add([embedding]);
            this.fragments.set(fragment.id, fragment);
            await this.dbManager.saveFaissIndex();
            operations.push({
                id: crypto.randomUUID(),
                type: 'write',
                layer: 'L3',
                operation: 'addVectorFragment',
                timestamp: new Date().toISOString(),
                duration_ms: 0,
                details: {
                    fragment_id: fragment.id,
                    content_type: fragment.metadata.content_type,
                    importance_score: fragment.metadata.importance_score
                }
            });
            return { operations };
        }
        catch (error) {
            console.error('L3 ingestion error:', error);
            return { operations };
        }
    }
    /**
     * Retrieve relevant fragments from vector memory
     */
    async retrieve(query) {
        try {
            if (this.fragments.size === 0) {
                return { fragments: [], relevance_score: 0, token_count: 0 };
            }
            const queryEmbedding = await this.generateEmbedding(query.query_text);
            const faissIndex = this.dbManager.getFaissIndex();
            const k = Math.min(10, this.fragments.size);
            if (faissIndex.ntotal() === 0) {
                return { fragments: [], relevance_score: 0, token_count: 0 };
            }
            const searchResult = faissIndex.search([queryEmbedding], k);
            const relevantFragments = [];
            const fragmentArray = Array.from(this.fragments.values());
            for (let i = 0; i < searchResult.distances[0].length; i++) {
                const index = searchResult.labels[0][i];
                const distance = searchResult.distances[0][i];
                if (index < fragmentArray.length) {
                    const fragment = { ...fragmentArray[index] };
                    fragment.similarity_score = Math.max(0, 1 - distance / 2);
                    fragment.metadata.last_accessed = new Date().toISOString();
                    fragment.metadata.access_count += 1;
                    relevantFragments.push(fragment);
                }
            }
            relevantFragments.sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));
            // Optional character scoping: keep only fragments tagged with character id
            let scoped = relevantFragments;
            if (query.character_id) {
                const tag = query.character_id.toLowerCase();
                scoped = relevantFragments.filter(f => f.metadata.tags.some(t => t.toLowerCase().includes(tag)));
            }
            const avgSimilarity = scoped.reduce((sum, frag) => sum + (frag.similarity_score || 0), 0) / (scoped.length || 1);
            const tokenCount = this.estimateL3TokenCount(scoped);
            return {
                fragments: scoped,
                relevance_score: avgSimilarity || 0,
                token_count: tokenCount
            };
        }
        catch (error) {
            console.error('L3 retrieval error:', error);
            return {
                fragments: [],
                relevance_score: 0,
                token_count: 0
            };
        }
    }
    generateSummary(turn, eventDetection) {
        // Simple summary generation - in a real implementation, this would use an LLM
        let summary = `[${turn.role.toUpperCase()}] `;
        if (eventDetection.detected_events.length > 0) {
            const primaryEvent = eventDetection.detected_events[0];
            summary += `${primaryEvent.type}: ${primaryEvent.description}`;
        }
        else {
            // Truncate content for summary
            summary += turn.content.length > 200 ?
                turn.content.substring(0, 200) + '...' :
                turn.content;
        }
        // Add emotional context if present
        if (eventDetection.emotional_changes.length > 0) {
            const emotions = eventDetection.emotional_changes.map(change => `${change.character_id}: ${change.trigger}`).join('; ');
            summary += ` [Emotions: ${emotions}]`;
        }
        return summary;
    }
    async generateEmbedding(text) {
        // Mock embedding generation - in reality, this would use a model like Sentence-BERT
        // For now, create a simple hash-based embedding
        const embedding = new Array(this.config.l3_vector_dimension).fill(0);
        // Simple character-based hash embedding
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            const index = char % this.config.l3_vector_dimension;
            embedding[index] += Math.sin(char * 0.01) * 0.1;
        }
        // Normalize
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        if (magnitude > 0) {
            for (let i = 0; i < embedding.length; i++) {
                embedding[i] /= magnitude;
            }
        }
        return embedding;
    }
    determineContentType(eventDetection) {
        if (eventDetection.detected_events.length > 0) {
            return 'event';
        }
        else if (eventDetection.significance_score > this.config.l2_significance_threshold * 1.5) {
            return 'insight';
        }
        else {
            return 'summary';
        }
    }
    extractTags(turn, eventDetection) {
        const tags = [];
        // Add role as tag
        tags.push(turn.role);
        // Add event types as tags
        eventDetection.detected_events.forEach(event => {
            tags.push(event.type);
        });
        // Add character IDs as tags
        eventDetection.emotional_changes.forEach(change => {
            tags.push(change.character_id);
        });
        // Add named entities as tags
        eventDetection.named_entities.forEach(entity => {
            tags.push(entity.type.toLowerCase());
        });
        return [...new Set(tags)]; // Remove duplicates
    }
    estimateL3TokenCount(fragments) {
        // Rough estimation: average 100 tokens per fragment content
        return fragments.reduce((sum, fragment) => {
            const contentTokens = Math.ceil(fragment.content.length / 4); // 4 chars per token
            return sum + contentTokens;
        }, 0);
    }
    /**
     * Public API methods
     */
    async inspect() {
        const faissIndex = this.dbManager.getFaissIndex();
        const contentTypes = {
            summary: 0,
            insight: 0,
            event: 0
        };
        const importanceStats = {
            min: Infinity,
            max: -Infinity,
            avg: 0
        };
        let totalImportance = 0;
        for (const fragment of this.fragments.values()) {
            contentTypes[fragment.metadata.content_type]++;
            const importance = fragment.metadata.importance_score;
            importanceStats.min = Math.min(importanceStats.min, importance);
            importanceStats.max = Math.max(importanceStats.max, importance);
            totalImportance += importance;
        }
        if (this.fragments.size > 0) {
            importanceStats.avg = totalImportance / this.fragments.size;
        }
        else {
            importanceStats.min = 0;
        }
        return {
            total_fragments: this.fragments.size,
            faiss_index_size: faissIndex.ntotal(),
            content_type_distribution: contentTypes,
            importance_statistics: importanceStats,
            dimension: this.config.l3_vector_dimension
        };
    }
    async getStatistics() {
        return await this.inspect();
    }
    /**
     * Prune old or low-importance fragments
     */
    async pruneFragments(maxFragments = this.config.l3_max_fragments) {
        if (this.fragments.size <= maxFragments)
            return;
        // Sort fragments by composite score (importance + recency + access)
        const fragmentsArray = Array.from(this.fragments.values());
        fragmentsArray.sort((a, b) => {
            const scoreA = this.calculateCompositeScore(a);
            const scoreB = this.calculateCompositeScore(b);
            return scoreB - scoreA; // Descending order
        });
        // Keep only the top fragments
        const toKeep = fragmentsArray.slice(0, maxFragments);
        const toRemove = fragmentsArray.slice(maxFragments);
        // Clear the fragments map and rebuild with kept fragments
        this.fragments.clear();
        toKeep.forEach(fragment => {
            this.fragments.set(fragment.id, fragment);
        });
        // TODO: Rebuild FAISS index with remaining fragments
        console.log(`Pruned ${toRemove.length} fragments from L3 memory`);
    }
    calculateCompositeScore(fragment) {
        const now = Date.now();
        const createdTime = new Date(fragment.metadata.created_at).getTime();
        const lastAccessTime = new Date(fragment.metadata.last_accessed).getTime();
        // Calculate age factors (newer = higher score)
        const ageFactor = Math.max(0, 1 - (now - createdTime) / (30 * 24 * 60 * 60 * 1000)); // 30 days max age
        const recentAccessFactor = Math.max(0, 1 - (now - lastAccessTime) / (7 * 24 * 60 * 60 * 1000)); // 7 days since last access
        // Combine factors
        const compositeScore = fragment.metadata.importance_score * 0.4 +
            ageFactor * 10 * 0.3 +
            recentAccessFactor * 10 * 0.2 +
            Math.log(fragment.metadata.access_count + 1) * 0.1;
        return compositeScore;
    }
}
