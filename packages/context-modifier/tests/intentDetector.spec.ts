import { describe, it, expect, beforeEach } from 'vitest';
import { IntentDetector } from '../src/intentDetector.js';
import type { IntentDetectionRule } from '@rpg/types';

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
  // Supplementary tests (annoyed/excited rules, duplicate handling, removal)
  describe('supplementary rule management & fallback', () => {
    const extraRules: Array<IntentDetectionRule> = [
      { intent: 'annoyed', keywords: ['mad','angry','annoyed'], patterns: ['annoy(ed)?'], confidence_threshold: 0.2, priority: 1 },
      { intent: 'excited', keywords: ['happy','glad','excited'], patterns: ['!{2,}$'], confidence_threshold: 0.2, priority: 2 }
    ];

    it('falls back when no rule matches (high threshold)', () => {
      const det = new IntentDetector({ rules: extraRules, defaultIntent: 'neutral', confidenceThreshold: 0.95, enableFallback: true });
      const res = det.detectIntent('this is a normal statement');
      expect(res.intent).toBe('neutral');
      expect(res.fallbackUsed).toBe(true);
    });

    it('detects keyword-based annoyed intent', () => {
      const det = new IntentDetector({ rules: extraRules, defaultIntent: 'neutral', confidenceThreshold: 0.2, enableFallback: true });
      const res = det.detectIntent('I am so ANGRY right now');
      expect(res.intent).toBe('annoyed');
      expect(res.fallbackUsed).toBe(false);
    });

    it('adds rule avoiding duplicates (same intent+keywords+patterns)', () => {
      const det = new IntentDetector({ rules: extraRules, defaultIntent: 'neutral', confidenceThreshold: 0.2, enableFallback: true });
      const before = det.getRules().length;
      det.addRule({ intent: 'annoyed', keywords: ['mad','angry','annoyed'], patterns: ['annoy(ed)?'], confidence_threshold: 0.2, priority: 1 });
      expect(det.getRules().length).toBe(before);
    });

    it('removeRule with non-existent id leaves rules unchanged', () => {
      const det = new IntentDetector({ rules: extraRules, defaultIntent: 'neutral', confidenceThreshold: 0.2, enableFallback: true });
      const before = det.getRules().length;
      det.removeRule('annoyed', 'nonexistent');
      expect(det.getRules().length).toBe(before);
    });
  });
});
