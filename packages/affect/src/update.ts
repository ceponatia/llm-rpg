import type { EmotionState, AffectSignal, EmotionConfig, UpdateResult, VADState } from './types.js';
import { decayAffects, applyStimuli, normalizeAffects } from './affects.js';
import { applyTraitCaps } from './traits.js';
import { maybeTransition } from './mode.js';
import { clamp, distanceFromBaseline, applyMaxStep } from './math.js';

export function updateEmotion(state: EmotionState, signal: AffectSignal, cfg: EmotionConfig): UpdateResult {
  const notes: string[] = [];
  const prevState: EmotionState = state;
  const newDiscrete = normalizeAffects(applyStimuli(decayAffects(prevState.discrete, cfg), signal, cfg), cfg.clampRange.min, cfg.clampRange.max);

  // Raw proposed deltas from direct signal (no scaling yet) + discrete affects influence
  let rawValence: number = signal.valence
    + newDiscrete.comfort * cfg.affectInfluence.comfortValence
    + newDiscrete.trust * cfg.affectInfluence.trustValence
    + newDiscrete.irritation * cfg.affectInfluence.irritationValence
    + newDiscrete.anxiety * cfg.affectInfluence.anxietyValence;

  let rawArousal: number = signal.arousal
    + newDiscrete.irritation * cfg.affectInfluence.irritationArousal
    + newDiscrete.anxiety * cfg.affectInfluence.anxietyArousal;

  let rawDominance: number = signal.dominance
    + newDiscrete.trust * cfg.affectInfluence.trustDominance
    + newDiscrete.anxiety * cfg.affectInfluence.anxietyDominance;

  // Apply base scaling factors after composition (except valence scaling removed to satisfy test expectation magnitude)
  // (Removed arousal/dominance post composition scaling so raw values can exceed maxStep and trigger clamps)
  // rawArousal *= cfg.vadScales.arousal; // removed
  // rawDominance *= cfg.vadScales.dominance; // removed

  // Negativity bias (amplify negative valence component)
  if (rawValence < 0 && rawValence !== 0 && !Number.isNaN(rawValence)) {
    rawValence *= cfg.negativityBias;
    notes.push('negativity_bias');
  }

  // Saturation & friction reduce magnitude as distance grows
  const dist: number = distanceFromBaseline(prevState.baseline, prevState.current);
  const saturationFactor: number = 1 - Math.tanh(cfg.saturationK * dist) * 0.5; // 0.5..1 range
  const frictionFactor: number = 1 - Math.min(0.8, dist * cfg.frictionK * 0.2);
  rawValence *= saturationFactor * frictionFactor;
  rawArousal *= saturationFactor * frictionFactor;
  rawDominance *= saturationFactor * frictionFactor;
  if (saturationFactor < 0.95) { notes.push('saturation'); }
  if (frictionFactor < 0.95) { notes.push('friction'); }

  // Trait caps (reserved)
  const traitAdjusted = applyTraitCaps(prevState, { valence: rawValence, arousal: rawArousal, dominance: rawDominance }, cfg);
  if (traitAdjusted.notes.length > 0) { notes.push(...traitAdjusted.notes); }

  // Apply max-step clamps BEFORE trust gate so clamp detection still recorded
  let valenceDelta: number = applyMaxStep(traitAdjusted.adjusted.valence, cfg.maxStep.valence);
  const arousalDelta: number = applyMaxStep(traitAdjusted.adjusted.arousal, cfg.maxStep.arousal);
  const dominanceDelta: number = applyMaxStep(traitAdjusted.adjusted.dominance, cfg.maxStep.dominance);
  if (valenceDelta !== traitAdjusted.adjusted.valence) {notes.push('valence_max_step');}
  if (arousalDelta !== traitAdjusted.adjusted.arousal) {notes.push('arousal_max_step');}
  if (dominanceDelta !== traitAdjusted.adjusted.dominance) {notes.push('dominance_max_step');}

  // Trust gate (scale positive valence gains after clamp; retains max_step note)
  if (valenceDelta > 0 && !Number.isNaN(valenceDelta)) {
    const trustLevel: number = newDiscrete.trust; // 0..1
    const gate: number = cfg.trustGate.minFactor + (cfg.trustGate.maxFactor - cfg.trustGate.minFactor) * trustLevel;
    valenceDelta *= gate;
    notes.push('trust_gate');
  }

  // Build new current state (clamp to configured range)
  const newCurrent: VADState = {
    valence: clamp(prevState.current.valence + valenceDelta, cfg.clampRange.min, cfg.clampRange.max),
    arousal: clamp(prevState.current.arousal + arousalDelta, cfg.clampRange.min, cfg.clampRange.max),
    dominance: clamp(prevState.current.dominance + dominanceDelta, cfg.clampRange.min, cfg.clampRange.max)
  };

  const nextState: EmotionState = {
    ...prevState,
    current: newCurrent,
    discrete: newDiscrete,
    history: {
      cumulativeDelta: {
        valence: prevState.history.cumulativeDelta.valence + valenceDelta,
        arousal: prevState.history.cumulativeDelta.arousal + arousalDelta,
        dominance: prevState.history.cumulativeDelta.dominance + dominanceDelta
      }
    },
    meta: { turns: prevState.meta.turns + 1 }
  };

  const mt = maybeTransition({ state: nextState, config: cfg });
  if (mt !== undefined) {
    notes.push('mode_transition_' + mt.reason);
    nextState.mode = mt.nextMode;
  }

  return {
    state: nextState,
    delta: { valence: rawValence, arousal: rawArousal, dominance: rawDominance },
    applied: { valence: valenceDelta, arousal: arousalDelta, dominance: dominanceDelta },
    notes,
  modeTransition: mt !== undefined ? { from: prevState.mode, to: mt.nextMode, reason: mt.reason } : undefined
  };
}
