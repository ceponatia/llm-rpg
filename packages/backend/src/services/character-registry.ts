import { CharacterProfile } from '@rpg/types';
import { readdirSync, readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export class CharacterRegistry {
  private static instance: CharacterRegistry;
  private characters: Map<string, CharacterProfile> = new Map();
  private loaded = false;
  private dataDir: string;

  private constructor(dataDir?: string) {
    if (dataDir) {
      this.dataDir = dataDir;
    } else {
      // Resolve relative to this file location first
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename); // .../packages/backend/src/services
      const candidates = [
        path.resolve(__dirname, '../../data/characters'),                 // ../.. -> backend/data/characters
        path.resolve(process.cwd(), 'data/characters'),                   // when cwd is backend root (after build maybe)
        path.resolve(process.cwd(), 'packages/backend/data/characters')   // when cwd is monorepo root
      ];
      const found = candidates.find(p => existsSync(p));
      this.dataDir = found || candidates[candidates.length - 1];
    }
  }

  static getInstance(dataDir?: string): CharacterRegistry {
    if (!CharacterRegistry.instance) {
      CharacterRegistry.instance = new CharacterRegistry(dataDir);
    }
    return CharacterRegistry.instance;
  }

  load(force = false): void {
    if (this.loaded && !force) return;
    this.characters.clear();
    try {
      const files = readdirSync(this.dataDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const raw = readFileSync(path.join(this.dataDir, file), 'utf-8');
          const parsed: CharacterProfile = JSON.parse(raw);
          if (parsed.id && parsed.name) {
            this.characters.set(parsed.id, parsed);
          }
        } catch (err) {
          console.error(`Failed to load character file ${file}:`, err);
        }
      }
      this.loaded = true;
      if (this.characters.size === 0) {
        console.warn(`[CharacterRegistry] No characters loaded from ${this.dataDir}`);
      }
    } catch (e) {
      console.error('CharacterRegistry load error:', e, 'dir:', this.dataDir);
    }
  }

  list(): CharacterProfile[] {
    if (!this.loaded) this.load();
    return Array.from(this.characters.values());
  }

  get(id: string): CharacterProfile | undefined {
    if (!this.loaded) this.load();
    return this.characters.get(id);
  }
}
