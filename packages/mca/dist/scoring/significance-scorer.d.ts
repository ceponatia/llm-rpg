import { MCAConfig, WorkingMemoryTurn, EventDetectionResult, VADState } from '@rpg/types';
/**
 * SignificanceScorer - Determines which conversation turns are worth remembering
 * Uses VAD deltas, keyword flags, and named entity detection
 */
export declare class SignificanceScorer {
    private config;
    private emotionalKeywords;
    private significantEvents;
    constructor(config: MCAConfig);
    /**
     * Score a conversation turn for significance (0-10 scale)
     */
    scoreConversationTurn(turn: WorkingMemoryTurn, context: WorkingMemoryTurn[]): number;
    /**
     * Detect significant events in a conversation turn
     */
    detectEvents(turn: WorkingMemoryTurn, context: WorkingMemoryTurn[]): EventDetectionResult;
    /**
     * Calculate magnitude of VAD state change
     */
    calculateVADDelta(current: VADState, previous: VADState): number;
    private scoreKeywords;
    private scoreEmotionalIntensity;
    private extractEvents;
    private detectEmotionalChanges;
    private extractNamedEntities;
    private classifyEntity;
    private findNearbyEntities;
    private estimateVADFromContent;
    private findPreviousVAD;
}
