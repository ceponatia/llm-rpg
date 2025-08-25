import { describe, it, expect, beforeEach } from 'vitest';
import { PersonaManager } from '../src/persona.js';
import type { PersonaDefinition } from '../../types/src/zod/contextModifier.zod.js';

const samplePersona = (id: string): PersonaDefinition => ({
  id,
  name: `Name ${id}`,
  description: 'Test persona',
  personality_traits: ['curious', 'wry'],
  background: 'Background',
  speaking_style: 'Succinct with dry humor.',
  base_emotional_state: { valence: 0, arousal: 0, dominance: 0 },
  system_prompt_template: 'You are {{name}}.',
  example_responses: ['Hello']
});

describe('PersonaManager', () => {
  let manager: PersonaManager;

  beforeEach(() => {
    manager = new PersonaManager();
  });

  it('registers and retrieves personas; first becomes default', async () => {
    const p1 = samplePersona('p1');
    manager.registerPersona(p1);
    expect(manager.getDefaultPersona()).toEqual(p1);
    expect(await manager.loadPersona('p1')).toEqual(p1);
    expect(manager.listPersonaIds()).toEqual(['p1']);
  });

  it('prevents duplicate registrations', () => {
    const p1 = samplePersona('dup');
    manager.registerPersona(p1);
    expect(() => manager.registerPersona(p1)).toThrow(/already registered/);
  });

  it('allows setting a new default persona', () => {
    const p1 = samplePersona('a');
    const p2 = samplePersona('b');
    manager.registerPersona(p1);
    manager.registerPersona(p2);
    manager.setDefaultPersona('b');
    expect(manager.getDefaultPersona()).toEqual(p2);
  });

  it('clears cache', () => {
    manager.registerPersona(samplePersona('x'));
    manager.clearCache();
    expect(manager.listPersonaIds()).toEqual([]);
    expect(manager.getDefaultPersona()).toBeNull();
  });
});
