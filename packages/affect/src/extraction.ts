import type { AffectSignal, ExtractionInput } from './types.js';

function clampUnit(v: number): number { return v < 0 ? 0 : v > 1 ? 1 : v; }
function clampSigned(v: number): number { return v < -1 ? -1 : v > 1 ? 1 : v; }

// Very minimal heuristic placeholder (extend with NLP later)
export function extractUserAffectSignals(input: ExtractionInput): AffectSignal {
  const text: string = input.text.toLowerCase();
  const complimentMatchArray = text.match(/\b(thank you|thanks|great|awesome|love|nice|appreciate)\b/g);
  const insultMatchArray = text.match(/\b(stupid|dumb|hate|sucks|idiot)\b/g);
  const empathyMatchArray = text.match(/\b(sorry|feel for you|understand)\b/g);
  const threatMatchArray = text.match(/\b(kill|hurt|attack|destroy)\b/g);
  const complimentMatches: number = complimentMatchArray !== null ? complimentMatchArray.length : 0;
  const insultMatches: number = insultMatchArray !== null ? insultMatchArray.length : 0;
  const empathyMatches: number = empathyMatchArray !== null ? empathyMatchArray.length : 0;
  const threatMatches: number = threatMatchArray !== null ? threatMatchArray.length : 0;

  const polarity: number = typeof input.sentimentPolarity === 'number' ? clampSigned(input.sentimentPolarity) : clampSigned((complimentMatches - insultMatches) / 5);
  const exclamations = text.match(/!/g);
  const exclamationCount = exclamations !== null ? exclamations.length : 0;
  const arousalCueScore: number = typeof input.arousalCueScore === 'number' ? clampUnit(input.arousalCueScore) : clampUnit(exclamationCount / 5);
  const dominanceCueScore: number = typeof input.dominanceCueScore === 'number' ? clampSigned(input.dominanceCueScore) : clampSigned((threatMatches - empathyMatches) / 5);

  const compliment: number = clampUnit(complimentMatches / 3);
  const insult: number = clampUnit(insultMatches / 3);
  const empathy: number = clampUnit(empathyMatches / 3);
  const threat: number = clampUnit(threatMatches / 3);
  const intensity: number = clampUnit((compliment + insult + empathy + threat + arousalCueScore) / 5);

  return {
    valence: polarity,
    arousal: arousalCueScore * (polarity >= 0 ? 1 : 1),
    dominance: dominanceCueScore,
    compliment,
    insult,
    empathy,
    threat,
    intensity
  };
}
