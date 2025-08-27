/**
 * Context Modifier Package - Public API
 * 
 * Generates LLM system prompts based on user input context with:
 * - Static persona injection
 * - Dynamic scene-specific modifiers 
 * - Intent detection and state persistence
 * - RAG context integration
 */

// Core classes
import { PersonaManager } from './persona.js';
import { IntentDetector } from './intentDetector.js';
import { ModifierManager } from './modifiers.js';
import { ModifierStateManager } from './modifierState.js';
import { PromptBuilder } from './buildPrompt.js';

export { PersonaManager } from './persona.js';
export { IntentDetector } from './intentDetector.js';
export { ModifierManager } from './modifiers.js';
export { ModifierStateManager } from './modifierState.js';
export { PromptBuilder, buildPrompt } from './buildPrompt.js';
export { buildBaseSystemPrompt } from './prompts/baseSystemPrompt.js';

// Types and interfaces
export type { IntentDetectionResult } from './intentDetector.js';
export type { ModifierConfig } from './modifiers.js';
export type { StateConfig, StateStorage } from './modifierState.js';
export type { 
  PromptBuilderConfig, 
  PromptBuildResult 
} from './buildPrompt.js';

// Re-export types from the types package for convenience
export type { Intent, IntentDetectionRule, ModifierFragment, PersonaDefinition, ModifierState, PromptParts, ContextModifierConfig } from '@rpg/types';

/**
 * Factory function to create a fully configured PromptBuilder
 * TODO: Implement factory function with sensible defaults
 */
export function createPromptBuilder(config?: {
  personaManager?: PersonaManager;
  intentDetector?: IntentDetector;  
  modifierManager?: ModifierManager;
  stateManager?: ModifierStateManager;
  builderConfig?: Partial<import('./buildPrompt.js').PromptBuilderConfig>;
}): PromptBuilder {
  const personaManager: PersonaManager = config?.personaManager ?? new PersonaManager();
  const intentDetector: IntentDetector = config?.intentDetector ?? new IntentDetector();
  const modifierManager: ModifierManager = config?.modifierManager ?? new ModifierManager();
  const stateManager: ModifierStateManager = config?.stateManager ?? new ModifierStateManager();
  return new PromptBuilder(personaManager, intentDetector, modifierManager, stateManager, config?.builderConfig);
}

/**
 * Default configuration for quick setup
 * TODO: Define sensible defaults
 */
export const DEFAULT_CONFIG = {
  flavorProbability: 0.4,
  maxPromptLength: 4000
} as const;