import { describe, it, expect } from 'vitest';
import { VectorIndex } from '../src/database/vector.js';

describe('VectorIndex mock', () => {
  it('initializes and exposes mock search', async () => {
    const vi = new VectorIndex({ indexPath: 'tmp/faiss/index.bin', dimension: 10 });
    await vi.initialize();
    const idx = vi.getIndex();
    const res = idx.search([[0,0,0,0,0,0,0,0,0,0]], 1);
    expect(res).toHaveProperty('distances');
    expect(res).toHaveProperty('labels');
  });
});
