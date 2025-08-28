export interface VADState { valence: number; arousal: number; dominance: number; }

export interface DiscreteAffects {
  comfort: number;
  trust: number;
  irritation: number;
  anxiety: number;
}

export type Mode = 'Guarded' | 'OpeningUp' | 'Warm' | 'Distressed';

export interface EmotionConfig {
  decay: number;
  affectStimulusScale: {
    compliment: number;
    insult: number;
    empathy: number;
    threat: number;
  };
  vadScales: {
    valence: number;
    arousal: number;
    dominance: number;
  };
  affectInfluence: {
    comfortValence: number;
    trustValence: number;
    irritationValence: number;
    anxietyValence: number;
    irritationArousal: number;
    anxietyArousal: number;
    trustDominance: number;
    anxietyDominance: number;
  };
  negativityBias: number;
  saturationK: number;
  frictionK: number;
  maxStep: {
    valence: number;
    arousal: number;
    dominance: number;
  };
  traitCaps: {
    reserved: {
      arousalAboveBaseline: number;
      dominanceAboveBaseline: number;
      positiveArousalDeltaScale: number;
      positiveDominanceDeltaScale: number;
    };
  };
  trustGate: {
    minFactor: number;
    maxFactor: number;
  };
  clampRange: {
    min: number;
    max: number;
  };
}

export interface PersonalityTraits {
  reserved: boolean;
}

export interface EmotionState {
  baseline: VADState;
  current: VADState;
  discrete: DiscreteAffects;
  mode: Mode;
  traits: PersonalityTraits;
  history: {
    cumulativeDelta: VADState;
  };
  meta: {
    turns: number;
  };
}

export interface AffectSignal {
  valence: number; // -1..1
  arousal: number; // -1..1 (signed to allow down-regulation)
  dominance: number; // -1..1
  compliment: number; // 0..1
  insult: number; // 0..1
  empathy: number; // 0..1
  threat: number; // 0..1
  intensity: number; // 0..1 global scaling
}

export interface UpdateResult {
  state: EmotionState;
  delta: VADState; // raw proposed delta after discrete affects + signals
  applied: VADState; // final applied delta post gates & clamping
  notes: string[];
  modeTransition?: {
    from: Mode;
    to: Mode;
    reason: string;
  };
}

export interface ExtractionInput {
  text: string;
  sentimentPolarity?: number; // optional precomputed -1..1
  arousalCueScore?: number; // 0..1
  dominanceCueScore?: number; // -1..1
}

export interface ModeTransitionContext {
  state: EmotionState;
  config: EmotionConfig;
}

export interface ModeTransitionResult {
  nextMode: Mode;
  reason: string;
}

export type MaybeTransitionFn = (ctx: ModeTransitionContext) => ModeTransitionResult | undefined;
