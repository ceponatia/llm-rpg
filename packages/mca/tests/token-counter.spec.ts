import { describe, it, expect } from 'vitest';
import { estimateTokens, estimateObjectTokens, estimateCost, truncateToTokenLimit, batchEstimate } from '../src/utils/token-counter';

describe('token-counter', () => {
  it('estimates tokens for plain text', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('hello world')).toBeGreaterThan(0);
  });

  it('estimates object tokens recursively', () => {
    const obj = { a: 'hello', b: [1, 2, 'three'] };
    const tokens = estimateObjectTokens(obj);
    expect(tokens).toBeGreaterThan(0);
  });

  it('computes cost per model', () => {
    const base = estimateCost(10, 'mistral');
    const gpt4 = estimateCost(10, 'gpt-4');
    expect(gpt4).toBeGreaterThan(base);
  });

  it('truncates long text respecting token ceiling', () => {
    const long = 'word '.repeat(200);
    const truncated = truncateToTokenLimit(long, 50);
    expect(truncated.endsWith('...')).toBe(true);
    expect(truncated.length).toBeLessThan(long.length);
  });

  it('batch estimates list', () => {
    const texts = ['a', 'b c'];
    const results = batchEstimate(texts);
    expect(results).toHaveLength(2);
    expect(results[0].tokens).toBeGreaterThanOrEqual(0);
  });
});
