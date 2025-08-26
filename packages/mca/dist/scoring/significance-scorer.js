/**
 * SignificanceScorer - Determines which conversation turns are worth remembering
 * Uses VAD deltas, keyword flags, and named entity detection
 */
export class SignificanceScorer {
    config;
    emotionalKeywords = {
        high_valence: ['happy', 'joy', 'excited', 'love', 'wonderful', 'amazing', 'fantastic'],
        low_valence: ['sad', 'angry', 'hate', 'terrible', 'awful', 'depressed', 'frustrated'],
        high_arousal: ['excited', 'energetic', 'thrilled', 'panicked', 'furious', 'ecstatic'],
        high_dominance: ['powerful', 'confident', 'strong', 'control', 'command', 'dominant']
    };
    significantEvents = {
        relationship_change: ['friend', 'enemy', 'love', 'hate', 'marry', 'divorce', 'meet', 'leave'],
        conflict: ['fight', 'argue', 'conflict', 'war', 'battle', 'dispute', 'disagree'],
        resolution: ['resolve', 'agree', 'peace', 'solution', 'compromise', 'reconcile'],
        achievement: ['win', 'success', 'accomplish', 'achieve', 'complete', 'victory'],
        loss: ['lose', 'fail', 'death', 'end', 'defeat', 'failure']
    };
    constructor(config) {
        this.config = config;
    }
    /**
     * Score a conversation turn for significance (0-10 scale)
     */
    scoreConversationTurn(turn, context) {
        let score = 0;
        // Base score for all turns
        score += 1;
        // Length-based scoring (longer messages often more significant)
        const wordCount = turn.content.split(/\s+/).length;
        score += Math.min(2, wordCount / 50); // Up to 2 points for longer messages
        // Keyword-based scoring
        score += this.scoreKeywords(turn.content);
        // Emotional intensity scoring
        score += this.scoreEmotionalIntensity(turn.content);
        // Question/exclamation scoring
        const questionMatches = turn.content.match(/\?/g);
        const exclamationMatches = turn.content.match(/!/g);
        const questionCount = questionMatches !== null ? questionMatches.length : 0;
        const exclamationCount = exclamationMatches !== null ? exclamationMatches.length : 0;
        score += Math.min(1, (questionCount + exclamationCount) * 0.3);
        // Context-based scoring (response to significant previous turn)
        if (context.length > 0) {
            const previousTurn = context[context.length - 1];
            if (previousTurn.role !== turn.role) { // Different speaker
                const previousScore = this.scoreConversationTurn(previousTurn, context.slice(0, -1));
                score += Math.min(1, previousScore * 0.2); // Inherit some significance
            }
        }
        // Named entity bonus
        const entities = this.extractNamedEntities(turn.content);
        score += Math.min(1, entities.length * 0.2);
        return Math.min(10, score);
    }
    /**
     * Detect significant events in a conversation turn
     */
    detectEvents(turn, context) {
        const significance_score = this.scoreConversationTurn(turn, context);
        const is_significant = significance_score >= this.config.l2_significance_threshold;
        const detected_events = this.extractEvents(turn.content);
        const emotional_changes = this.detectEmotionalChanges(turn.content, context);
        const named_entities = this.extractNamedEntities(turn.content);
        return { is_significant, significance_score, detected_events, emotional_changes, named_entities };
    }
    /**
     * Calculate magnitude of VAD state change
     */
    calculateVADDelta(current, previous) {
        const valenceDelta = Math.abs(current.valence - previous.valence);
        const arousalDelta = Math.abs(current.arousal - previous.arousal);
        const dominanceDelta = Math.abs(current.dominance - previous.dominance);
        // Euclidean distance in VAD space
        return Math.sqrt(valenceDelta ** 2 + arousalDelta ** 2 + dominanceDelta ** 2);
    }
    scoreKeywords(content) {
        const lowerContent = content.toLowerCase();
        let score = 0;
        // Check for emotional keywords
        Object.values(this.emotionalKeywords).forEach(keywords => {
            keywords.forEach(keyword => { if (lowerContent.includes(keyword)) {
                score += 0.5;
            } });
        });
        // Check for significant event keywords
        Object.values(this.significantEvents).forEach(keywords => {
            keywords.forEach(keyword => { if (lowerContent.includes(keyword)) {
                score += 0.8;
            } });
        });
        return Math.min(3, score);
    }
    scoreEmotionalIntensity(content) {
        let intensity = 0;
        // All caps words (shouting)
        const capsWords = content.match(/\b[A-Z]{2,}\b/g);
        const capsCount = capsWords !== null ? capsWords.length : 0;
        intensity += Math.min(1, capsCount * 0.3);
        // Repeated punctuation
        const repeatedPunct = content.match(/[!?]{2,}|\.{3,}/g);
        const repeatCount = repeatedPunct !== null ? repeatedPunct.length : 0;
        intensity += Math.min(1, repeatCount * 0.4);
        // Extreme adjectives
        const extremeWords = ['absolutely', 'completely', 'totally', 'extremely', 'incredibly', 'unbelievably'];
        extremeWords.forEach(word => { if (content.toLowerCase().includes(word)) {
            intensity += 0.3;
        } });
        return Math.min(2, intensity);
    }
    extractEvents(content) {
        const events = [];
        const lowerContent = content.toLowerCase();
        Object.entries(this.significantEvents).forEach(([eventType, keywords]) => {
            keywords.forEach(keyword => {
                if (lowerContent.includes(keyword)) {
                    // Simple entity extraction - look for proper nouns nearby
                    const entities = this.findNearbyEntities(content, keyword);
                    events.push({
                        type: eventType,
                        confidence: 0.7, // Base confidence
                        description: `Detected ${eventType} event: "${keyword}"`,
                        entities_involved: entities
                    });
                }
            });
        });
        return events;
    }
    detectEmotionalChanges(content, context) {
        const changes = [];
        const entities = this.extractNamedEntities(content);
        // For each detected person, estimate their emotional state
        entities.filter(e => e.type === 'PERSON').forEach(entity => {
            const currentVAD = this.estimateVADFromContent(content);
            const previousVAD = this.findPreviousVAD(entity.text, context) ?? { valence: 0, arousal: 0, dominance: 0 }; // Neutral default
            const delta = this.calculateVADDelta(currentVAD, previousVAD);
            if (delta >= this.config.l2_emotional_delta_threshold) {
                changes.push({
                    character_id: `character:${entity.text.toLowerCase()}`,
                    previous_vad: previousVAD,
                    new_vad: currentVAD,
                    delta_magnitude: delta,
                    trigger: content.substring(Math.max(0, entity.start_pos - 20), entity.end_pos + 20)
                });
            }
        });
        return changes;
    }
    extractNamedEntities(content) {
        const entities = [];
        // Simple pattern-based NER (in reality, would use a proper NER model)
        // Detect proper nouns (capitalized words)
        const properNouns = content.match(/\b[A-Z][a-z]+\b/g);
        if (properNouns !== null && properNouns.length > 0) {
            for (const noun of properNouns) {
                const startPos = content.indexOf(noun);
                entities.push({
                    text: noun,
                    type: this.classifyEntity(noun, content),
                    confidence: 0.8,
                    start_pos: startPos,
                    end_pos: startPos + noun.length
                });
            }
        }
        // Detect quoted strings (might be objects or concepts)
        const quotedStrings = content.match(/"([^"]+)"/g);
        if (quotedStrings !== null && quotedStrings.length > 0) {
            quotedStrings.forEach(quoted => {
                const text = quoted.slice(1, -1); // Remove quotes
                const startPos = content.indexOf(quoted);
                entities.push({ text, type: 'OBJECT', confidence: 0.6, start_pos: startPos, end_pos: startPos + quoted.length });
            });
        }
        return entities;
    }
    classifyEntity(entity, context) {
        const lowerEntity = entity.toLowerCase();
        const lowerContext = context.toLowerCase();
        // Check for person indicators
        const personIndicators = ['said', 'told', 'asked', 'replied', 'thinks', 'feels', 'went'];
        if (personIndicators.some(indicator => lowerContext.includes(`${lowerEntity} ${indicator}`) || lowerContext.includes(`${indicator} ${lowerEntity}`))) {
            return 'PERSON';
        }
        // Check for place indicators
        const placeIndicators = ['in', 'at', 'to', 'from', 'near', 'city', 'town', 'country'];
        if (placeIndicators.some(indicator => lowerContext.includes(`${indicator} ${lowerEntity}`) || lowerContext.includes(`${lowerEntity} ${indicator}`))) {
            return 'PLACE';
        }
        // Default to PERSON for single capitalized words in conversation
        return 'PERSON';
    }
    findNearbyEntities(content, keyword) {
        // Find proper nouns within 50 characters of the keyword
        const keywordIndex = content.toLowerCase().indexOf(keyword.toLowerCase());
        if (keywordIndex === -1) {
            return [];
        }
        const start = Math.max(0, keywordIndex - 50);
        const end = Math.min(content.length, keywordIndex + keyword.length + 50);
        const nearby = content.substring(start, end);
        const properNouns = nearby.match(/\b[A-Z][a-z]+\b/g);
        if (properNouns === null || properNouns.length === 0) {
            return [];
        }
        return [...new Set(properNouns)];
    }
    estimateVADFromContent(content) {
        const lowerContent = content.toLowerCase();
        let valence = 0;
        let arousal = 0;
        let dominance = 0;
        // Analyze emotional keywords in context
        this.emotionalKeywords.high_valence.forEach(word => { if (lowerContent.includes(word)) {
            valence += 0.3;
        } });
        this.emotionalKeywords.low_valence.forEach(word => { if (lowerContent.includes(word)) {
            valence -= 0.3;
        } });
        this.emotionalKeywords.high_arousal.forEach(word => { if (lowerContent.includes(word)) {
            arousal += 0.3;
        } });
        this.emotionalKeywords.high_dominance.forEach(word => { if (lowerContent.includes(word)) {
            dominance += 0.3;
        } });
        // Clamp values to valid ranges
        return { valence: Math.max(-1, Math.min(1, valence)), arousal: Math.max(0, Math.min(1, arousal)), dominance: Math.max(0, Math.min(1, dominance)) };
    }
    findPreviousVAD(entityName, context) {
        // Look through previous turns for mentions of this entity
        for (let i = context.length - 1; i >= 0; i--) {
            const turn = context[i];
            if (turn.content.toLowerCase().includes(entityName.toLowerCase())) {
                return this.estimateVADFromContent(turn.content);
            }
        }
        return null;
    }
}
