import type { EmotionConfig, EmotionState, VADState } from './types.js';

export interface TraitCapResult { adjusted: VADState; notes: Array<string>; }

export function applyTraitCaps(state: EmotionState, proposed: VADState, config: EmotionConfig): TraitCapResult {
  const notes: Array<string> = [];
  const valence: number = proposed.valence;
  let arousal: number = proposed.arousal;
  let dominance: number = proposed.dominance;
  if (state.traits.reserved) {
    const arousalCap: number = state.baseline.arousal + config.traitCaps.reserved.arousalAboveBaseline;
    if (arousal > 0 && state.current.arousal + arousal > arousalCap) {
      arousal = Math.min(arousal, Math.max(0, arousalCap - state.current.arousal));
      notes.push('reserved_cap_arousal');
    }
    if (arousal > 0) {
      arousal *= config.traitCaps.reserved.positiveArousalDeltaScale;
      notes.push('reserved_scale_arousal');
    }
    const dominanceCap: number = state.baseline.dominance + config.traitCaps.reserved.dominanceAboveBaseline;
    if (dominance > 0 && state.current.dominance + dominance > dominanceCap) {
      dominance = Math.min(dominance, Math.max(0, dominanceCap - state.current.dominance));
      notes.push('reserved_cap_dominance');
    }
    if (dominance > 0) {
      dominance *= config.traitCaps.reserved.positiveDominanceDeltaScale;
      notes.push('reserved_scale_dominance');
    }
  }
  return { adjusted: { valence, arousal, dominance }, notes };
}
