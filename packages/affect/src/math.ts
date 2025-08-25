import type { VADState } from './types.js';

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function distanceFromBaseline(baseline: VADState, current: VADState): number {
  const dv: number = current.valence - baseline.valence;
  const da: number = current.arousal - baseline.arousal;
  const dd: number = current.dominance - baseline.dominance;
  return Math.sqrt(dv * dv + da * da + dd * dd);
}

export function applyMaxStep(delta: number, maxStep: number): number {
  if (delta > maxStep) return maxStep;
  if (delta < -maxStep) return -maxStep;
  return delta;
}

export function vadAdd(a: VADState, b: VADState): VADState {
  return { valence: a.valence + b.valence, arousal: a.arousal + b.arousal, dominance: a.dominance + b.dominance };
}

export function vadZero(): VADState { return { valence: 0, arousal: 0, dominance: 0 }; }

export function vadScale(a: VADState, s: number): VADState { return { valence: a.valence * s, arousal: a.arousal * s, dominance: a.dominance * s }; }

export function copyVAD(a: VADState): VADState { return { valence: a.valence, arousal: a.arousal, dominance: a.dominance }; }
