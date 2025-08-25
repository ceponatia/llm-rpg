/**
 * Persona Management Module
 * Handles loading and managing static persona definitions
 */

import { personaDefinitionSchema, type PersonaDefinition } from '../../types/src/zod/contextModifier.zod.js';

/**
 * Persona manager for loading and caching character definitions
 */
export class PersonaManager {
  private readonly personas = new Map<string, PersonaDefinition>();
  private defaultPersonaId?: string;

  /**
   * Load a persona by ID
   * TODO: Implement persona loading from configuration or database
   */
  public async loadPersona(personaId: string): Promise<PersonaDefinition | null> {
    // minimal await to satisfy require-await (I/O could be added later)
    await Promise.resolve();
    if (personaId.trim().length === 0) {
      return null;
    }
    const existing: PersonaDefinition | undefined = this.personas.get(personaId);
    return existing ?? null;
  }

  /**
   * Register a new persona definition
   * TODO: Implement persona registration with validation
   */
  public registerPersona(persona: PersonaDefinition): void {
    // Validate structure (will throw if invalid)
    const validated: PersonaDefinition = personaDefinitionSchema.parse(persona);
    if (this.personas.has(validated.id)) {
      throw new Error(`Persona with id '${validated.id}' already registered`);
    }
    this.personas.set(validated.id, validated);
  this.defaultPersonaId ??= validated.id;
  }

  /**
   * Get the default persona
   * TODO: Implement default persona retrieval
   */
  public getDefaultPersona(): PersonaDefinition | null {
    if (this.defaultPersonaId === undefined) {
      return null;
    }
    const persona: PersonaDefinition | undefined = this.personas.get(this.defaultPersonaId);
    return persona ?? null;
  }

  /**
   * Set the default persona ID
   * TODO: Implement default persona setting
   */
  public setDefaultPersona(personaId: string): void {
  if (this.personas.has(personaId) === false) {
      throw new Error(`Cannot set default persona. Unknown id '${personaId}'.`);
    }
    this.defaultPersonaId = personaId;
  }

  /**
   * List all available persona IDs
   * TODO: Implement persona listing
   */
  public listPersonaIds(): Array<string> {
	return Array.from(this.personas.keys());
  }

  /**
   * Clear persona cache
   * TODO: Implement cache clearing
   */
  public clearCache(): void {
	this.personas.clear();
	this.defaultPersonaId = undefined;
  }
}