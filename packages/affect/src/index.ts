export type { DiscreteAffects, EmotionConfig, EmotionState, PersonalityTraits, AffectSignal, UpdateResult, ExtractionInput, Mode, ModeTransitionContext, ModeTransitionResult, MaybeTransitionFn, VADState } from './types.js';
export { defaultConfig } from './config.js';
export { initEmotionState } from './state.js';
export { updateEmotion } from './update.js';
export { extractUserAffectSignals } from './extraction.js';
export { maybeTransition } from './mode.js';
