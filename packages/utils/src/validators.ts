import { VADState, WeightedMemoryFusion } from '@rpg/types';

/**
 * Validation utilities for CAS data structures
 */
export class Validators {
  /**
   * Validate VAD emotional state values
   */
  static isValidVADState(vad: VADState): boolean {
    return (
      typeof vad.valence === 'number' &&
      vad.valence >= -1 && vad.valence <= 1 &&
      typeof vad.arousal === 'number' &&
      vad.arousal >= 0 && vad.arousal <= 1 &&
      typeof vad.dominance === 'number' &&
      vad.dominance >= 0 && vad.dominance <= 1
    );
  }

  /**
   * Validate fusion weights (should sum to approximately 1.0)
   */
  static isValidFusionWeights(weights: WeightedMemoryFusion): boolean {
    const sum = weights.w_L1 + weights.w_L2 + weights.w_L3;
    return (
      typeof weights.w_L1 === 'number' &&
      typeof weights.w_L2 === 'number' &&
      typeof weights.w_L3 === 'number' &&
      weights.w_L1 >= 0 && weights.w_L1 <= 1 &&
      weights.w_L2 >= 0 && weights.w_L2 <= 1 &&
      weights.w_L3 >= 0 && weights.w_L3 <= 1 &&
      Math.abs(sum - 1.0) < 0.01 // Allow small floating point errors
    );
  }

  /**
   * Validate importance score (0-10 scale)
   */
  static isValidImportanceScore(score: number): boolean {
    return typeof score === 'number' && score >= 0 && score <= 10;
  }

  /**
   * Validate session ID format
   */
  static isValidSessionId(sessionId: string): boolean {
    return typeof sessionId === 'string' && sessionId.length > 0 && sessionId.length <= 100;
  }

  /**
   * Validate UUID format
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Sanitize text input
   */
  static sanitizeText(text: string, maxLength: number = 10000): string {
    if (typeof text !== 'string') {
      return '';
    }
    
    // Remove control characters using a constructed regex
    // eslint-disable-next-line no-control-regex
    const controlCharsRegex = new RegExp('[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]', 'g');
    
    return text
      .trim()
      .substring(0, maxLength)
      .replace(controlCharsRegex, ''); // Remove control characters
  }
}