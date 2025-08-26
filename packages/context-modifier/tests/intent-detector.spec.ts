import { describe, it, expect } from 'vitest';
import { IntentDetector } from '../src/intentDetector.js';
import type { IntentDetectionRule } from '@rpg/types';

describe('IntentDetector (supplementary tests)', () => {
  // Use only intents defined in intentSchema
  const rules: Array<IntentDetectionRule> = [
    { intent: 'annoyed', keywords: ['mad','angry','annoyed'], patterns: ['annoy(ed)?'], confidence_threshold: 0.2, priority: 1 },
    { intent: 'excited', keywords: ['happy','glad','excited'], patterns: ['!{2,}$'], confidence_threshold: 0.2, priority: 2 }
  ];

  it('falls back when no rule matches (high threshold)', () => {
    const det = new IntentDetector({ rules, defaultIntent: 'neutral', confidenceThreshold: 0.95, enableFallback: true });
    const res = det.detectIntent('this is a normal statement');
    expect(res.intent).toBe('neutral');
    expect(res.fallbackUsed).toBe(true);
  });

  it('detects keyword-based annoyed intent', () => {
    const det = new IntentDetector({ rules, defaultIntent: 'neutral', confidenceThreshold: 0.2, enableFallback: true });
    const res = det.detectIntent('I am so ANGRY right now');
    expect(res.intent).toBe('annoyed');
    expect(res.fallbackUsed).toBe(false);
  });

  it('adds rule avoiding duplicates (same intent+keywords+patterns)', () => {
    const det = new IntentDetector({ rules, defaultIntent: 'neutral', confidenceThreshold: 0.2, enableFallback: true });
    const before = det.getRules().length;
    det.addRule({ intent: 'annoyed', keywords: ['mad','angry','annoyed'], patterns: ['annoy(ed)?'], confidence_threshold: 0.2, priority: 1 });
    expect(det.getRules().length).toBe(before); // duplicate ignored
  });

  it('removeRule with non-existent id leaves rules unchanged', () => {
    const det = new IntentDetector({ rules, defaultIntent: 'neutral', confidenceThreshold: 0.2, enableFallback: true });
    const before = det.getRules().length;
    det.removeRule('annoyed', 'nonexistent');
    expect(det.getRules().length).toBe(before);
  });
});
