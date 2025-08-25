import type { EmotionConfig } from './types.js';

export const defaultConfig: EmotionConfig = {
  decay: 0.85,
  affectStimulusScale: {
    compliment: 0.6,
    insult: 0.8,
    empathy: 0.5,
    threat: 0.9
  },
  vadScales: {
    valence: 0.5,
    arousal: 0.5,
    dominance: 0.4
  },
  affectInfluence: {
    comfortValence: 0.25,
    trustValence: 0.2,
    irritationValence: -0.35,
    anxietyValence: -0.4,
    irritationArousal: 0.45,
    anxietyArousal: 0.5,
    trustDominance: 0.25,
    anxietyDominance: -0.3
  },
  negativityBias: 1.3,
  saturationK: 1.2,
  frictionK: 0.6,
  maxStep: {
    valence: 0.6,
    arousal: 0.5,
    dominance: 0.4
  },
  traitCaps: {
    reserved: {
      arousalAboveBaseline: 0.22,
      dominanceAboveBaseline: 0.18,
      positiveArousalDeltaScale: 0.55,
      positiveDominanceDeltaScale: 0.6
    }
  },
  trustGate: {
    minFactor: 0.35,
    maxFactor: 1.0
  },
  clampRange: {
    min: 0.0,
    max: 1.0
  }
};
