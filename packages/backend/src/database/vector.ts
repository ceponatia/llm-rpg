import { promises as fs } from 'fs';
import { dirname } from 'path';
import { logger } from '@rpg/utils';

export interface FaissConfig { indexPath: string; dimension: number; }

// Minimal mock index used for now
export interface MockFaissIndex {
  add(v: Array<Array<number>>): void;
  search(v: Array<Array<number>>, k: number): { distances: Array<Array<number>>; labels: Array<Array<number>> };
  ntotal(): number;
  writeIndex(path: string): Promise<void>;
  readIndex(path: string): Promise<void>;
}

export class VectorIndex {
  private index: MockFaissIndex | null = null;
  constructor(private readonly config: FaissConfig) {}

  public async initialize(): Promise<void> {
    await fs.mkdir(dirname(this.config.indexPath), { recursive: true });
    // In-memory mock state
    const stored: number[][] = [];
    this.index = {
      add: (vectors: number[][]) => {
        for (const v of vectors) stored.push(v);
        logger.debug('Mock FAISS add vectors', { added: vectors.length, total: stored.length });
      },
      search: (vectors: number[][], k: number) => {
        // Extremely naive mock search: return zero distances and indices 0..k-1 (bounded)
        const labels: number[][] = vectors.map(() => Array.from({ length: k }, (_, i) => (i < stored.length ? i : -1)));
        const distances: number[][] = labels.map(row => row.map(() => 0));
        return { distances, labels };
      },
      ntotal: () => stored.length,
      writeIndex: async (path: string) => {
        const payload = JSON.stringify({ dimension: this.config.dimension, count: stored.length });
        await fs.writeFile(path, payload, 'utf8');
        logger.debug('Mock FAISS index written', { path, count: stored.length });
      },
      readIndex: async (path: string) => {
        try {
          const data = await fs.readFile(path, 'utf8');
          const parsed = JSON.parse(data) as { count?: number };
          // Rehydrate with zero vectors; only log since we don't persist actual vectors in mock.
          logger.debug('Mock FAISS index read', { path, loadedCount: parsed.count ?? 0 });
        } catch (err) {
          logger.warn('Mock FAISS index read skipped (file missing or invalid)', { err, path });
        }
      }
    };
    logger.info('Mock FAISS index created');
  }

  public getIndex(): MockFaissIndex {
    if (this.index == null) throw new Error('Vector index not initialized');
    return this.index;
  }

  public async save(): Promise<void> {
    if (this.index) {
      await this.index.writeIndex(this.config.indexPath);
    }
  }
}
