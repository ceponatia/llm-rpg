/**
 * Token counting utilities for memory management
 */
export class TokenCounter {
  /**
   * Estimate token count for text (approximation: 4 characters per token)
   */
  static estimateTokens(text: string): number {
    if (!text) return 0;
    
    // More sophisticated estimation considering:
    // - Whitespace doesn't count as much
    // - Punctuation is often separate tokens
    // - Average English word is ~4.5 characters
    
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const punctuation = (text.match(/[.,!?;:"'()-]/g) || []).length;
    
    // Rough estimation: 0.75 tokens per word + punctuation tokens
    return Math.ceil(words.length * 0.75 + punctuation);
  }

  /**
   * Estimate tokens for structured data objects
   */
  static estimateObjectTokens(obj: unknown): number {
    if (typeof obj === 'string') {
      return this.estimateTokens(obj);
    }
    
    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return 1;
    }
    
    if (Array.isArray(obj)) {
      return obj.reduce((sum, item) => sum + this.estimateObjectTokens(item), 0);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      let tokens = 2; // Opening and closing braces
      for (const [key, value] of Object.entries(obj)) {
        tokens += this.estimateTokens(key); // Property name
        tokens += this.estimateObjectTokens(value); // Property value
        tokens += 1; // Separator/colon
      }
      return tokens;
    }
    
    return 0;
  }

  /**
   * Calculate cost based on token count (mock pricing)
   */
  static estimateCost(tokens: number, model: string = 'mistral'): number {
    // Mock pricing - in reality this would depend on the actual model
    const costPerToken = {
      'mistral': 0.0001,
      'gpt-3.5': 0.0015,
      'gpt-4': 0.03
    };

    return tokens * (costPerToken[model as keyof typeof costPerToken] || costPerToken['mistral']);
  }

  /**
   * Truncate text to fit within token limit
   */
  static truncateToTokenLimit(text: string, maxTokens: number): string {
    const estimatedTokens = this.estimateTokens(text);
    
    if (estimatedTokens <= maxTokens) {
      return text;
    }
    
    // Rough character limit based on token estimate
    const charLimit = Math.floor((maxTokens / estimatedTokens) * text.length);
    
    // Try to truncate at word boundaries
    const truncated = text.substring(0, charLimit);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > charLimit * 0.8) { // If we can keep 80% of target length
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * Batch process multiple texts and return token counts
   */
  static batchEstimate(texts: string[]): { text: string; tokens: number }[] {
    return texts.map(text => ({
      text,
      tokens: this.estimateTokens(text)
    }));
  }
}