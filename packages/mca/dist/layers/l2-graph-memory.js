// Import extracted modules
import { processFact } from '../l2/ingestion/fact-store.js';
import { processRelationship } from '../l2/ingestion/relationship-store.js';
import { upsertCharacter } from '../l2/ingestion/character-store.js';
import { storeTurn } from '../l2/ingestion/turn-store.js';
import { retrieveRelevantCharacters } from '../l2/retrievers/retrieve-characters.js';
import { retrieveRelevantFacts } from '../l2/retrievers/retrieve-facts.js';
import { retrieveRelevantRelationships } from '../l2/retrievers/retrieve-relationships.js';
import { calculateL2RelevanceScore, estimateL2TokenCount } from '../l2/scoring/scores.js';
import { mapNodeToCharacter } from '../l2/mapping/character.js';
import { mapNodeToFact } from '../l2/mapping/fact.js';
/**
 * L2 Graph Memory - Episodic & Emotional Graph using Neo4j
 * Stores structured "who, what, when" with VAD emotional states
 */
export class L2GraphMemory {
    dbManager;
    config;
    driver;
    constructor(dbManager, config) {
        this.dbManager = dbManager;
        this.config = config;
        try {
            this.driver = dbManager.getDriver();
        }
        catch (error) {
            throw new Error(`Failed to initialize L2GraphMemory: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Ingest a conversation turn into the graph memory
     */
    async ingestTurn(turn, eventDetection, sessionId) {
        const session = this.driver.session();
        try {
            return await session.executeWrite(async (tx) => {
                const operations = [];
                const factsUpdated = [];
                const relationshipsModified = [];
                // 1. Create or update characters with emotional states
                for (const emotionalChange of eventDetection.emotional_changes) {
                    const characterId = emotionalChange.character_id;
                    const newVAD = emotionalChange.new_vad;
                    await upsertCharacter(tx, characterId, newVAD);
                    operations.push({
                        id: crypto.randomUUID(),
                        type: 'update',
                        layer: 'L2',
                        operation: 'updateCharacterEmotion',
                        timestamp: new Date().toISOString(),
                        duration_ms: 0,
                        details: { character_id: characterId, vad_state: newVAD }
                    });
                }
                // 2. Process detected events for fact extraction
                for (const event of eventDetection.detected_events) {
                    switch (event.type) {
                        case 'fact_assertion': {
                            const factResult = await processFact(tx, event, turn, sessionId);
                            operations.push(...factResult.operations);
                            factsUpdated.push(...factResult.fact_ids);
                            break;
                        }
                        case 'relationship_change': {
                            const relResult = await processRelationship(tx, event, turn, sessionId);
                            operations.push(...relResult.operations);
                            relationshipsModified.push(...relResult.relationship_ids);
                            break;
                        }
                    }
                }
                // 3. Store the conversation turn itself
                await storeTurn(tx, turn, sessionId, eventDetection.significance_score);
                operations.push({
                    id: crypto.randomUUID(),
                    type: 'write',
                    layer: 'L2',
                    operation: 'storeTurn',
                    timestamp: new Date().toISOString(),
                    duration_ms: 0,
                    details: { turn_id: turn.id, session_id: sessionId }
                });
                return { operations, facts_updated: factsUpdated, relationships_modified: relationshipsModified };
            });
        }
        finally {
            await session.close();
        }
    }
    /**
     * Retrieve relevant context from graph memory
     */
    async retrieve(query) {
        const session = this.driver.session();
        try {
            return await session.executeRead(async (tx) => {
                // Multi-query approach: characters, facts, and relationships
                const [characters, facts, relationships] = await Promise.all([
                    retrieveRelevantCharacters(tx, query),
                    retrieveRelevantFacts(tx, query),
                    retrieveRelevantRelationships(tx, query)
                ]);
                // Optional character scoping (client may send character_id)
                let scopedCharacters = characters;
                let scopedFacts = facts;
                let scopedRelationships = relationships;
                if (query.character_id != null && query.character_id.trim().length > 0) {
                    // Simple filter heuristic: keep items mentioning character id or name
                    const cid = query.character_id.toLowerCase();
                    scopedCharacters = characters.filter(c => c.id.toLowerCase().includes(cid) || c.name.toLowerCase().includes(cid));
                    scopedFacts = facts.filter(f => f.entity.toLowerCase().includes(cid));
                    scopedRelationships = relationships.filter(r => r.from_entity.toLowerCase().includes(cid) || r.to_entity.toLowerCase().includes(cid));
                }
                // Calculate overall relevance score
                const relevanceScore = calculateL2RelevanceScore(scopedCharacters, scopedFacts, scopedRelationships);
                // Estimate token count
                const tokenCount = estimateL2TokenCount(scopedCharacters, scopedFacts, scopedRelationships);
                return {
                    characters: scopedCharacters,
                    facts: scopedFacts,
                    relationships: scopedRelationships,
                    relevance_score: relevanceScore,
                    token_count: tokenCount
                };
            });
        }
        finally {
            await session.close();
        }
    }
    // Public API methods
    async getAllCharacters() {
        const session = this.driver.session();
        try {
            return await session.executeRead(async (tx) => {
                const result = await tx.run('MATCH (c:Character) RETURN c ORDER BY c.name');
                return result.records.map((record) => {
                    const node = record.get('c');
                    return mapNodeToCharacter(node);
                });
            });
        }
        finally {
            await session.close();
        }
    }
    getEmotionalHistory() {
        // TODO: Implement emotional history tracking
        return Promise.resolve([]);
    }
    async getFactWithHistory(factId) {
        const session = this.driver.session();
        try {
            return await session.executeRead(async (tx) => {
                const result = await tx.run('MATCH (f:Fact {id: $factId}) RETURN f', { factId });
                if (result.records.length === 0) {
                    return null;
                }
                const node = result.records[0].get('f');
                return mapNodeToFact(node);
            });
        }
        finally {
            await session.close();
        }
    }
    async inspect() {
        const session = this.driver.session();
        try {
            const toNum = (val) => val.toNumber();
            return await session.executeRead(async (tx) => {
                const [charResult, factResult, relResult, turnResult] = await Promise.all([
                    tx.run('MATCH (c:Character) RETURN count(c) as count'),
                    tx.run('MATCH (f:Fact) RETURN count(f) as count'),
                    tx.run('MATCH ()-[r:RELATIONSHIP]->() RETURN count(r) as count'),
                    tx.run('MATCH (t:Turn) RETURN count(t) as count')
                ]);
                const characters = toNum(charResult.records[0].get('count'));
                const facts = toNum(factResult.records[0].get('count'));
                const relationships = toNum(relResult.records[0].get('count'));
                const conversation_turns = toNum(turnResult.records[0].get('count'));
                return { characters, facts, relationships, conversation_turns };
            });
        }
        finally {
            await session.close();
        }
    }
    async getStatistics() {
        return await this.inspect();
    }
}
