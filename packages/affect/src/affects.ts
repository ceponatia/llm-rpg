import type { DiscreteAffects, AffectSignal, EmotionConfig } from './types.js';

export function decayAffects(prev: DiscreteAffects, cfg: EmotionConfig): DiscreteAffects {
  return {
    comfort: prev.comfort * cfg.decay,
    trust: prev.trust * cfg.decay,
    irritation: prev.irritation * cfg.decay,
    anxiety: prev.anxiety * cfg.decay
  };
}

export function applyStimuli(base: DiscreteAffects, signal: AffectSignal, cfg: EmotionConfig): DiscreteAffects {
  const sc = cfg.affectStimulusScale;
  const intensity: number = signal.intensity;
  const comfort: number = base.comfort + (signal.compliment * sc.compliment + signal.empathy * sc.empathy) * intensity;
  const trust: number = base.trust + (signal.compliment * sc.compliment + signal.empathy * sc.empathy) * 0.7 * intensity;
  const irritation: number = base.irritation + (signal.insult * sc.insult + signal.threat * sc.threat * 0.5) * intensity;
  const anxiety: number = base.anxiety + (signal.threat * sc.threat + signal.insult * sc.insult * 0.3) * intensity;
  return { comfort, trust, irritation, anxiety };
}

export function normalizeAffects(a: DiscreteAffects, min: number, max: number): DiscreteAffects {
  function clamp(v: number): number { return v < min ? min : v > max ? max : v; }
  return { comfort: clamp(a.comfort), trust: clamp(a.trust), irritation: clamp(a.irritation), anxiety: clamp(a.anxiety) };
}
