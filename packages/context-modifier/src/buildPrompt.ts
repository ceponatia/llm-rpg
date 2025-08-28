/**
 * Prompt Building Module
 * Main orchestrator that composes final system prompts from persona + modifier + RAG context
 */

import type { PersonaDefinition, ModifierState, PromptParts, ModifierFragment } from '@rpg/types';
import type { VADState } from '../../types/src/common.js';
import { PersonaManager } from './persona.js';
import { IntentDetector, type IntentDetectionResult } from './intentDetector.js';
import { ModifierManager } from './modifiers.js';
import { ModifierStateManager } from './modifierState.js';
import { buildBaseSystemPrompt } from './prompts/baseSystemPrompt.js';
import { buildEmotionalContext } from './prompts/emotion.js';
import { renderPersona } from './prompts/personaTemplate.js';
import { formatActiveModifiers } from './prompts/modifierFormatter.js';
import { buildSceneContext } from './prompts/scene.js';

// Temporary interface until proper export exists in @rpg/types
interface ModifierApplicationResult {
  applied_modifiers: string[];
  intensities: Record<string, number>;
  emotional_adjustment: VADState;
  final_intensity?: number; // placeholder for future aggregate
}

/**
 * Configuration for prompt building
 */
export interface PromptBuilderConfig {
  includeEmotionalContext: boolean;
  includeSceneContext: boolean;
  maxPromptLength: number;
  ragContextWeight: number;
  modifierIntensityThreshold: number;
}

/**
 * Result of prompt building process
 */
export interface PromptBuildResult {
  finalPrompt: string;
  promptParts: PromptParts;
  detectedIntent: IntentDetectionResult;
  appliedModifiers: string[];
  totalTokens: number;
  truncated: boolean;
}

/**
 * Main prompt builder that orchestrates all components
 */
export class PromptBuilder {
  private readonly personaManager: PersonaManager;
  private readonly intentDetector: IntentDetector;
  private readonly modifierManager: ModifierManager;
  private readonly stateManager: ModifierStateManager;
  private config: PromptBuilderConfig;

  public constructor(
    personaManager: PersonaManager,
    intentDetector: IntentDetector,
    modifierManager: ModifierManager,
    stateManager: ModifierStateManager,
    config?: Partial<PromptBuilderConfig>
  ) {
    this.personaManager = personaManager;
    this.intentDetector = intentDetector;
    this.modifierManager = modifierManager;
    this.stateManager = stateManager;
    
    this.config = {
      includeEmotionalContext: true,
      includeSceneContext: true,
      maxPromptLength: 4000,
      ragContextWeight: 0.3,
      modifierIntensityThreshold: 0.1,
      ...config
    };
  }

  /**
   * Build final system prompt from user message and optional RAG context
   */
  public async buildPrompt(
    userMessage: string,
    sessionId: string,
  personaId?: string,
  ragContext?: string[]
  ): Promise<PromptBuildResult> {
    const persona: PersonaDefinition | null = personaId !== undefined && personaId !== ''
      ? await this.personaManager.loadPersona(personaId)
      : this.personaManager.getDefaultPersona();
    if (persona == null) {
      throw new Error('Persona not found');
    }

    const detectedIntent: IntentDetectionResult = this.intentDetector.detectIntent(userMessage);
    const existingState: ModifierState | null = await this.stateManager.getState(sessionId);
  const baseEmotional: VADState = existingState?.current_emotional_state ?? persona.base_emotional_state;

    let currentIntensities: Record<string, number> = {};
    const active = existingState?.active_modifiers;
    if (active !== undefined) {
      currentIntensities = Object.fromEntries(
        Object.entries(active).map(([k, v]): [string, number] => [k, (v as { intensity: number }).intensity])
      );
    }

    const modifierApplication: ModifierApplicationResult = this.modifierManager.applyModifiers(
      detectedIntent.intent,
      currentIntensities,
      baseEmotional
    );

    const newActive: Record<string, number> = modifierApplication.applied_modifiers.reduce(
      (acc: Record<string, number>, id: string): Record<string, number> => {
        const intensity: number = modifierApplication.intensities[id] ?? 0;
        acc[id] = intensity;
        return acc;
      },
      {}
    );

  const updatedState: ModifierState = await this.stateManager.updateState(
      sessionId,
      detectedIntent.intent,
      newActive,
      modifierApplication.emotional_adjustment
    );

    const parts: PromptParts = this.composePromptParts(
      persona,
      modifierApplication.applied_modifiers,
      updatedState.current_emotional_state,
      ragContext
    );

    const finalPrompt: string = this.buildFinalPrompt(parts);
    const { prompt, truncated, tokens } = this.truncatePrompt(finalPrompt, this.config.maxPromptLength);

    return {
      finalPrompt: prompt,
      promptParts: parts,
      detectedIntent,
      appliedModifiers: modifierApplication.applied_modifiers,
      totalTokens: tokens,
      truncated
    };
  }

  /**
   * Compose prompt parts into structured components
   */
  private composePromptParts(
    persona: PersonaDefinition,
    appliedModifiers: string[],
    currentEmotionalState: VADState,
    ragContext?: string[]
  ): PromptParts {
    const personaText: string = renderPersona(persona);
    const all = this.modifierManager.listModifiers();
    const modifierObjects: ModifierFragment[] = appliedModifiers
      .map((id: string): ModifierFragment | undefined => all.find((m: ModifierFragment) => m.id === id))
      .filter((m: ModifierFragment | undefined): m is ModifierFragment => m !== undefined);
    const modifierText: string = formatActiveModifiers(modifierObjects, {});
  const emotionalContext: string | undefined = this.config.includeEmotionalContext === true
      ? buildEmotionalContext(currentEmotionalState)
      : undefined;
  const sceneContext: string | undefined = this.config.includeSceneContext === true
      ? buildSceneContext(appliedModifiers)
      : undefined;

    return {
      persona_text: personaText,
      modifier_text: modifierText,
  rag_context: (ragContext !== undefined && ragContext.length > 0) ? ragContext : undefined,
      emotional_context: emotionalContext,
      scene_context: sceneContext
    } as PromptParts;
  }

  /**
   * Build final prompt string from parts
   */
  private buildFinalPrompt(parts: PromptParts): string {
    return buildBaseSystemPrompt({
      personaText: parts.persona_text,
      modifierText: parts.modifier_text,
      ragContext: parts.rag_context,
      emotionalContext: parts.emotional_context,
      sceneContext: parts.scene_context
    });
  }

  /**
   * Apply length limits and truncation
   */
  private truncatePrompt(prompt: string, maxLength: number): { 
    prompt: string; 
    truncated: boolean; 
    tokens: number; 
  } {
    const tokens: number = Math.ceil(prompt.length / 4); // rough heuristic
    if (prompt.length <= maxLength) {
      return { prompt, truncated: false, tokens };
    }
    const truncatedPrompt: string = prompt.slice(0, maxLength - 20) + '\n...';
    const newTokens: number = Math.ceil(truncatedPrompt.length / 4);
    return { prompt: truncatedPrompt, truncated: true, tokens: newTokens };
  }

  public updateConfig(newConfig: Partial<PromptBuilderConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): PromptBuilderConfig {
    return { ...this.config };
  }
}

export async function buildPrompt(
  userMessage: string, 
  ragContext?: string[]
): Promise<string> {
  const personaManager: PersonaManager = new PersonaManager();
  const intentDetector: IntentDetector = new IntentDetector();
  const modifierManager: ModifierManager = new ModifierManager();
  const stateManager: ModifierStateManager = new ModifierStateManager();
  const builder: PromptBuilder = new PromptBuilder(personaManager, intentDetector, modifierManager, stateManager, {});
  const result: PromptBuildResult = await builder.buildPrompt(userMessage, 'default', undefined, ragContext);
  return result.finalPrompt;
}