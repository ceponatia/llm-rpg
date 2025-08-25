import type { EmotionState, PersonalityTraits, VADState } from './types.js';

export function initEmotionState(baseline: VADState, traits: PersonalityTraits): EmotionState {
  return {
    baseline: { ...baseline },
    current: { ...baseline },
    discrete: { comfort: 0, trust: 0, irritation: 0, anxiety: 0 },
    mode: 'Guarded',
    traits,
    history: { cumulativeDelta: { valence: 0, arousal: 0, dominance: 0 } },
    meta: { turns: 0 }
  };
}
