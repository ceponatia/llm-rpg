/**
 * Modifiers Module
 * Manages scene-specific modifiers and their application logic
 */

import { modifierFragmentSchema, type Intent, type ModifierFragment } from '@rpg/types';
import type { VADState } from '../../types/src/common.js';

/**
 * Configuration for modifier application
 */
export interface ModifierConfig {
  maxActiveModifiers: number;
  intensityDecayRate: number;
  priorityWeighting: boolean;
  emotionalBlending: boolean;
}

export interface ModifierApplicationResult {
  applied_modifiers: Array<string>;
  intensities: Record<string, number>;
  emotional_adjustment: VADState;
  final_intensity?: number;
}

/**
 * Manager for scene-specific prompt modifiers
 */
export class ModifierManager {
  private readonly modifiers = new Map<string, ModifierFragment>();
  private readonly intentMappings = new Map<Intent, Array<string>>();
  private config: ModifierConfig;

  public constructor(config?: Partial<ModifierConfig>) {
    this.config = {
      maxActiveModifiers: 3,
      intensityDecayRate: 0.1,
      priorityWeighting: true,
      emotionalBlending: true,
      ...config
    };
  }

  /**
   * Register a modifier fragment
   * TODO: Implement modifier registration with validation
   */
  public registerModifier(modifier: ModifierFragment): void {
    const validated = modifierFragmentSchema.parse(modifier);
    if (this.modifiers.has(validated.id)) {
      throw new Error(`Modifier '${validated.id}' already registered`);
    }
    this.modifiers.set(validated.id, validated);
  }

  /**
   * Apply modifiers for a given intent
   * TODO: Implement modifier application logic
   */
  public applyModifiers(
    intent: Intent,
    currentIntensity: Record<string, number>,
    baseEmotionalState: VADState
  ): ModifierApplicationResult {
    const mapping = this.intentMappings.get(intent) ?? [];
    const candidates: Array<ModifierFragment> = (mapping.length > 0
      ? mapping.map(id => this.modifiers.get(id)).filter((m): m is ModifierFragment => m != null)
      : Array.from(this.modifiers.values())
    ).sort((a, b) => a.priority - b.priority);

    const selected = candidates.slice(0, this.config.maxActiveModifiers);
    const intensities: Record<string, number> = {};
    for (const m of selected) {
      // basic intensity: existing * 0.9 + multiplier * 0.1
      const prev = currentIntensity[m.id] ?? 0;
      const mult = m.intensity_multiplier;
      intensities[m.id] = Math.min(1, prev * 0.9 + mult * 0.1);
    }
    // Emotional blending (very naive average of impacts + base)
    let emotional_adjustment: VADState = baseEmotionalState;
    const impacts = selected.map(m => m.emotional_impact).filter((e): e is VADState => e != null);
    if (impacts.length > 0 && this.config.emotionalBlending) {
      const sum = impacts.reduce((acc, e) => ({
        valence: acc.valence + e.valence,
        arousal: acc.arousal + e.arousal,
        dominance: acc.dominance + e.dominance
      }), { ...baseEmotionalState });
      emotional_adjustment = {
        valence: sum.valence / (impacts.length + 1),
        arousal: sum.arousal / (impacts.length + 1),
        dominance: sum.dominance / (impacts.length + 1)
      };
    }
    return {
      applied_modifiers: selected.map(m => m.id),
      intensities,
      emotional_adjustment
    };
  }

  /**
   * Get modifiers for a specific intent
   * TODO: Implement modifier retrieval by intent
   */
  public getModifiersForIntent(intent: Intent): Array<ModifierFragment> {
    const ids = this.intentMappings.get(intent);
  if (ids === undefined) { return []; }
    return ids.map(id => this.modifiers.get(id)).filter((m): m is ModifierFragment => m != null);
  }

  /**
   * Set intent to modifier mappings
   * TODO: Implement intent mapping configuration
   */
  public setIntentMappings(mappings: Map<Intent, Array<string>>): void {
    this.intentMappings.clear();
    for (const [intent, ids] of mappings.entries()) {
      const validIds = ids.filter(id => this.modifiers.has(id));
      this.intentMappings.set(intent, validIds);
    }
  }

  /**
   * Calculate intensity decay over turns
   * TODO: Implement intensity decay calculation
   */
  public calculateIntensityDecay(currentIntensity: number, turnsPassed: number): number {
    const rate = this.config.intensityDecayRate;
    return Math.max(0, currentIntensity * Math.pow(1 - rate, turnsPassed));
  }

  /**
   * Blend emotional states from multiple modifiers
   * TODO: Implement emotional state blending
   */
  private blendEmotionalStates(
    baseState: VADState,
    modifierStates: Array<VADState>,
    intensities: Array<number>
  ): VADState {
    if (modifierStates.length === 0) { return baseState; }
    let total = 0;
    const accum = { valence: 0, arousal: 0, dominance: 0 };
    for (let i = 0; i < modifierStates.length; i++) {
      const w = intensities[i] ?? 0;
      total += w;
      accum.valence += modifierStates[i].valence * w;
      accum.arousal += modifierStates[i].arousal * w;
      accum.dominance += modifierStates[i].dominance * w;
    }
    if (total === 0) { return baseState; }
    return {
      valence: (baseState.valence + accum.valence) / (total + 1),
      arousal: (baseState.arousal + accum.arousal) / (total + 1),
      dominance: (baseState.dominance + accum.dominance) / (total + 1)
    };
  }

  /**
   * Generate prompt text additions from modifiers
   * TODO: Implement prompt text generation
   */
  private generatePromptAdditions(
    activeModifiers: Array<ModifierFragment>,
    intensities: Array<number>
  ): Array<string> {
    return activeModifiers.map((m, i) => `${m.text} (x${intensities[i]?.toFixed(2) ?? '0.00'})`);
  }

  /**
   * List all registered modifiers
   * TODO: Implement modifier listing
   */
  public listModifiers(): Array<ModifierFragment> {
    return Array.from(this.modifiers.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Update modifier configuration
   * TODO: Implement configuration updates
   */
  public updateConfig(newConfig: Partial<ModifierConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}