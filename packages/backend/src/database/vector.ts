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
    this.index = {
      add: () => {},
      search: () => ({ distances: [[]], labels: [[]] }),
      ntotal: () => 0,
      writeIndex: async () => {},
      readIndex: async () => {}
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
