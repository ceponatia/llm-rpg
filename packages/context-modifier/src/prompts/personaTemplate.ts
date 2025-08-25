/**
 * Persona templating helpers.
 */
import type { PersonaDefinition } from '../../../types/src/zod/contextModifier.zod.js';

export function renderPersona(persona: PersonaDefinition): string {
  return [
    `Name: ${persona.name}`,
    `Summary: ${persona.description}`,
    `Personality traits: ${persona.personality_traits.join(', ')}`,
    `Speaking style: ${persona.speaking_style}`,
    `Background: ${persona.background}`
  ].join('\n');
}
