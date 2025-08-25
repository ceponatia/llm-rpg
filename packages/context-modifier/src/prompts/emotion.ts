/**
 * Emotion context helpers: convert VAD (Valence, Arousal, Dominance) state into descriptive text.
 */
import type { VADState } from '../../../types/src/common.js';

export interface EmotionDescriptor {
  label: string;
  description: string;
}

export function describeVAD(state: VADState): EmotionDescriptor {
  const { valence, arousal, dominance } = state;
  function bucket(v: number): 'low' | 'mid' | 'high' {
    if (v < 0.33) {return 'low';}
    if (v > 0.66) {return 'high';}
    return 'mid';
  }
  const vb = bucket(valence); const ab = bucket(arousal); const db = bucket(dominance);
  let label = 'neutral';
  if (vb === 'high' && ab === 'high') {label = 'excited / upbeat';}
  else if (vb === 'high' && ab === 'low') {label = 'content / calm';}
  else if (vb === 'low' && ab === 'high') {label = 'agitated / distressed';}
  else if (vb === 'low' && ab === 'low') {label = 'melancholic';}
  else if (vb === 'mid' && ab === 'high') {label = 'alert';}
  else if (vb === 'mid' && ab === 'low') {label = 'reserved';}

  const dominanceNote: string = db === 'high' ? 'assertive' : db === 'low' ? 'subdued' : 'balanced';
  const description = `Valence:${valence.toFixed(2)} (${vb}), Arousal:${arousal.toFixed(2)} (${ab}), Dominance:${dominance.toFixed(2)} (${db}) => mood: ${label}, stance: ${dominanceNote}`;
  return { label, description };
}

export function buildEmotionalContext(state: VADState): string {
  const d: EmotionDescriptor = describeVAD(state);
  return d.description;
}
