/**
 * Persona Management Module
 * Handles loading and managing static persona definitions
 */

import type { PersonaDefinition } from '../../types/src/zod/contextModifier.zod.js';
import { personaDefinitionSchema } from '../../types/src/zod/contextModifier.zod.js';

/**
 * Persona manager for loading and caching character definitions
 */
export class PersonaManager {
  private personas: Map<string, PersonaDefinition> = new Map();
  private defaultPersonaId?: string;

  /**
   * Load a persona by ID
   * TODO: Implement persona loading from configuration or database
   */
  async loadPersona(personaId: string): Promise<PersonaDefinition | null> {
    if (typeof personaId !== 'string' || personaId.trim().length === 0) {
      return null;
    }
    const existing: PersonaDefinition | undefined = this.personas.get(personaId);
    return existing || null;
  }

  /**
   * Register a new persona definition
   * TODO: Implement persona registration with validation
   */
  registerPersona(persona: PersonaDefinition): void {
    // Validate structure (will throw if invalid)
    const validated: PersonaDefinition = personaDefinitionSchema.parse(persona);
    if (this.personas.has(validated.id)) {
      throw new Error(`Persona with id '${validated.id}' already registered`);
    }
    this.personas.set(validated.id, validated);
    if (!this.defaultPersonaId) {
      this.defaultPersonaId = validated.id;
    }
  }

  /**
   * Get the default persona
   * TODO: Implement default persona retrieval
   */
  getDefaultPersona(): PersonaDefinition | null {
    if (!this.defaultPersonaId) {
      return null;
    }
    const persona: PersonaDefinition | undefined = this.personas.get(this.defaultPersonaId);
    return persona || null;
  }

  /**
   * Set the default persona ID
   * TODO: Implement default persona setting
   */
  setDefaultPersona(personaId: string): void {
    if (!this.personas.has(personaId)) {
      throw new Error(`Cannot set default persona. Unknown id '${personaId}'.`);
    }
    this.defaultPersonaId = personaId;
  }

  /**
   * List all available persona IDs
   * TODO: Implement persona listing
   */
  listPersonaIds(): string[] {
  return Array.from(this.personas.keys());
  }

  /**
   * Clear persona cache
   * TODO: Implement cache clearing
   */
  clearCache(): void {
  this.personas.clear();
  this.defaultPersonaId = undefined;
  }
}