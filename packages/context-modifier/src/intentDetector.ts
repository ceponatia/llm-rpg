/**
 * Intent Detection Module
 * Analyzes user messages to detect emotional/contextual intent using lightweight NLP
 */

import { intentSchema, intentDetectionRuleSchema, type Intent, type IntentDetectionRule } from '../../types/src/zod/contextModifier.zod.js';

/**
 * Result of intent detection analysis
 */
export interface IntentDetectionResult {
  intent: Intent;
  confidence: number;
  matchedRules: Array<string>;
  fallbackUsed: boolean;
}

/**
 * Configuration for intent detection
 */
export interface IntentDetectorConfig {
  rules: Array<IntentDetectionRule>;
  defaultIntent: Intent;
  confidenceThreshold: number;
  enableFallback: boolean;
}

/**
 * Intent detector using keyword matching and pattern recognition
 */
export class IntentDetector {
  private rules: Array<InternalRule> = [];
  private defaultIntent: Intent = 'neutral';
  private confidenceThreshold = 0.6;
  private enableFallback = true;
  private idCounter = 0;

  public constructor(config?: Partial<IntentDetectorConfig>) {
    if (config != null) {
      this.updateConfig(config);
    }
  }

  /**
   * Detect intent from user message
   * TODO: Implement intent detection using keyword/pattern matching
   */
  public detectIntent(userMessage: string): IntentDetectionResult {
    const normalized: string = userMessage.toLowerCase().trim();
    const candidates: Array<{ rule: InternalRule; confidence: number; keywordScore: number; patternScore: number }> = [];

    for (const rule of this.rules) {
      const keywordScore: number = this.analyzeKeywords(normalized, rule.keywords);
      const patternScore: number = this.matchPatterns(normalized, rule.patterns);
      const confidence: number = Math.max(keywordScore, patternScore);
      if (confidence > 0) {
        candidates.push({ rule, confidence, keywordScore, patternScore });
      }
    }

    // Filter by rule + global thresholds
    const passing: typeof candidates = candidates.filter(c => c.confidence >= this.confidenceThreshold && c.confidence >= c.rule.confidence_threshold);
    let chosen: typeof candidates[number] | undefined;
    if (passing.length > 0) {
      // Sort: higher confidence desc, then lower priority value (higher priority), then earlier insertion (id order)
      passing.sort((a, b) => {
        if (b.confidence !== a.confidence) {return b.confidence - a.confidence;}
        if (a.rule.priority !== b.rule.priority) {return a.rule.priority - b.rule.priority;}
        return a.rule.__numericId - b.rule.__numericId;
      });
      chosen = passing[0];
    }

  if (chosen == null) {
      return {
        intent: this.defaultIntent,
        confidence: 1.0,
        matchedRules: [],
        fallbackUsed: true
      };
    }

    return {
      intent: chosen.rule.intent,
      confidence: chosen.confidence,
      matchedRules: candidates.map(c => c.rule.__id),
      fallbackUsed: false
    };
  }

  /**
   * Update detector configuration
   * TODO: Implement configuration updates with validation
   */
  public updateConfig(config: Partial<IntentDetectorConfig>): void {
    if (config.defaultIntent !== undefined) {
      this.defaultIntent = intentSchema.parse(config.defaultIntent);
    }
    if (typeof config.confidenceThreshold === 'number') {
      this.confidenceThreshold = Math.min(Math.max(config.confidenceThreshold, 0), 1);
    }
    if (typeof config.enableFallback === 'boolean') {
      this.enableFallback = config.enableFallback;
    }
    if (config.rules != null) {
      this.rules = [];
      for (const rule of config.rules) {
        this.addRule(rule);
      }
    }
    // Ensure priority ordering
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Add a new intent detection rule
   * TODO: Implement rule addition with validation
   */
  public addRule(rule: IntentDetectionRule): void {
    const validated: IntentDetectionRule = intentDetectionRuleSchema.parse(rule);
    // Construct internal rule
    const internal: InternalRule = { ...validated, __id: this.generateRuleId(validated), __numericId: this.idCounter++ };
    // Prevent exact duplicate (same intent + same keywords + patterns)
    const duplicate: InternalRule | undefined = this.rules.find(r => r.intent === internal.intent && arrayEqual(r.keywords, internal.keywords) && arrayEqual(r.patterns, internal.patterns));
    if (duplicate != null) {
      return; // silently ignore duplicates
    }
    this.rules.push(internal);
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove an intent detection rule
   * TODO: Implement rule removal
   */
  public removeRule(intent: Intent, ruleId: string): void {
  this.rules = this.rules.filter(r => !(r.intent === intent && r.__id === ruleId));
  }

  /**
   * Get current detection rules
   * TODO: Implement rule listing
   */
  public getRules(): Array<IntentDetectionRule> {
	return this.rules
      .map(r => ({ intent: r.intent, keywords: [...r.keywords], patterns: [...r.patterns], confidence_threshold: r.confidence_threshold, priority: r.priority }))
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Analyze message for keyword matches (helper method)
   * TODO: Implement keyword analysis
   */
  private analyzeKeywords(message: string, keywords: Array<string>): number {
    if (keywords.length === 0) {
      return 0;
    }
    const tokens: Array<string> = message.split(/[^a-z0-9]+/g).filter(Boolean);
    if (tokens.length === 0) {
      return 0;
    }
    const tokenSet = new Set<string>(tokens);
    let matches = 0;
    for (const kw of keywords) {
      if (tokenSet.has(kw.toLowerCase())) {
        matches += 1;
      }
    }
    return matches / keywords.length;
  }

  /**
   * Apply pattern matching (helper method)  
   * TODO: Implement pattern matching
   */
  private matchPatterns(message: string, patterns: Array<string>): number {
    if (patterns.length === 0) {
      return 0;
    }
    let matches = 0;
    for (const raw of patterns) {
      try {
        const regex = new RegExp(raw, 'i');
        if (regex.test(message)) {
          matches += 1;
        }
      } catch {
        // ignore malformed pattern
      }
    }
    return matches / patterns.length;
  }

  /** Generate deterministic id for a rule */
  private generateRuleId(rule: IntentDetectionRule): string {
    const base = `${rule.intent}|${rule.priority}|${rule.keywords.join(',')}|${rule.patterns.join(',')}`;
    let hash = 0;
    for (let i = 0; i < base.length; i++) {
      hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
    }
    return `r_${hash.toString(16)}`;
  }
}

/** Internal decorated rule */
interface InternalRule extends IntentDetectionRule { __id: string; __numericId: number; }

function arrayEqual(a: Array<string>, b: Array<string>): boolean {
  if (a.length !== b.length) {return false;}
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {return false;}
  }
  return true;
}

// (no global augmentations needed)