import type { ModeTransitionContext, ModeTransitionResult, Mode, EmotionState } from './types.js';

export function maybeTransition(ctx: ModeTransitionContext): ModeTransitionResult | undefined {
  const state: EmotionState = ctx.state;
  const v: number = state.current.valence;
  const ir: number = state.discrete.irritation;
  const anx: number = state.discrete.anxiety;
  let target: Mode | undefined;
  let reason: string | undefined;
  if (state.mode === 'Guarded' && v > state.baseline.valence + 0.15 && state.discrete.comfort > 0.4) {
    target = 'OpeningUp'; reason = 'comfort_gain';
  } else if (state.mode === 'OpeningUp' && v > state.baseline.valence + 0.3 && state.discrete.trust > 0.5) {
    target = 'Warm'; reason = 'trust_gain';
  } else if (v < state.baseline.valence - 0.25 && (ir > 0.4 || anx > 0.45)) {
    target = 'Distressed'; reason = 'negative_affect';
  } else if (state.mode === 'Distressed' && v >= state.baseline.valence) {
    target = 'Guarded'; reason = 'recovered';
  }
  if (target !== undefined && target !== state.mode && reason !== undefined) {
    return { nextMode: target, reason };
  }
  return undefined;
}
