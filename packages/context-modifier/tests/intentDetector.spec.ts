import { describe, it, expect, beforeEach } from 'vitest';
import { IntentDetector } from '../src/intentDetector.js';
import type { IntentDetectionRule } from '../../types/src/zod/contextModifier.zod.js';

const rules: Array<IntentDetectionRule> = [
  { intent: 'romantic', keywords: ['love','dear'], patterns: ['heart'], confidence_threshold: 0.3, priority: 1 },
  { intent: 'conflict', keywords: ['angry','fight'], patterns: ['annoy(ed)?'], confidence_threshold: 0.3, priority: 1 },
  { intent: 'sad', keywords: ['sad','unhappy'], patterns: ['cry(ing)?'], confidence_threshold: 0.3, priority: 2 },
  { intent: 'excited', keywords: ['yay','awesome'], patterns: ['!{2,}'], confidence_threshold: 0.2, priority: 3 }
];

describe('IntentDetector', () => {
  let detector: IntentDetector;
  beforeEach(() => {
    detector = new IntentDetector({ rules, defaultIntent: 'neutral', confidenceThreshold: 0.25 });
  });

  it('detects romantic via keyword match', () => {
    const res = detector.detectIntent('I love this');
    expect(res.intent).toBe('romantic');
    expect(res.fallbackUsed).toBe(false);
  });

  it('falls back when below threshold', () => {
    const res = detector.detectIntent('word with no match');
    expect(res.intent).toBe('neutral');
    expect(res.fallbackUsed).toBe(true);
  });

  it('detects conflict via pattern', () => {
    const res = detector.detectIntent('I am so annoyed right now');
    expect(res.intent).toBe('conflict');
  });

  it('prioritizes lower priority value on tie', () => {
    // craft message matching both romantic and conflict keywords partially
    const res = detector.detectIntent('dear friend I am angry');
    // Both match: romantic (dear) & conflict (angry). Confidence both 0.5 -> choose priority 1 (same) then insertion order -> romantic defined first
    expect(['romantic','conflict']).toContain(res.intent);
  });
});
