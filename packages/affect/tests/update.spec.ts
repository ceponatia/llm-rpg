import { describe, it, expect } from 'vitest';
import { defaultConfig, initEmotionState, updateEmotion } from '../src/index.js';
import type { AffectSignal, EmotionState, PersonalityTraits, VADState } from '../src/types.js';

function baseline(): VADState { return { valence: 0.5, arousal: 0.4, dominance: 0.5 }; }
function traits(reserved: boolean): PersonalityTraits { return { reserved }; }

function signal(partial: Partial<AffectSignal>): AffectSignal {
  return {
    valence: 0,
    arousal: 0,
    dominance: 0,
    compliment: 0,
    insult: 0,
    empathy: 0,
    threat: 0,
    intensity: 1,
    ...partial
  };
}

describe('affect update core', () => {
  it('applies negativity bias to negative valence', () => {
    const state: EmotionState = initEmotionState(baseline(), traits(false));
    const res = updateEmotion(state, signal({ valence: -0.5 }), defaultConfig);
    expect(res.delta.valence).toBeLessThan(-0.5 * 0.9); // amplified
    expect(res.notes).toContain('negativity_bias');
  });

  it('caps positive arousal for reserved', () => {
    const state: EmotionState = initEmotionState(baseline(), traits(true));
    const res = updateEmotion(state, signal({ arousal: 1, valence: 0.2 }), defaultConfig);
    expect(res.notes.some((n: string): boolean => n.startsWith('reserved_cap') || n.startsWith('reserved_scale'))).toBe(true);
  });

  it('applies saturation when far from baseline', () => {
    let state: EmotionState = initEmotionState(baseline(), traits(false));
    for (let i = 0; i < 10; i++) {
      state = updateEmotion(state, signal({ compliment: 1, valence: 0.8 }), defaultConfig).state;
    }
    const res = updateEmotion(state, signal({ compliment: 1, valence: 0.8 }), defaultConfig);
    expect(res.notes).toContain('saturation');
  });

  it('enforces maxStep clamp', () => {
    const state: EmotionState = initEmotionState(baseline(), traits(false));
    const big = updateEmotion(state, signal({ valence: 1, arousal: 1, dominance: 1 }), defaultConfig);
    expect(big.notes).toEqual(expect.arrayContaining(['valence_max_step', 'arousal_max_step', 'dominance_max_step']));
  });
});
