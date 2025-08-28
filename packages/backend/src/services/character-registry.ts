import type { CharacterProfile } from '@rpg/types';
import { readdirSync, readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '@rpg/utils';
// Local minimal type guard (avoid cross-package resolution issues)
function isCharacterProfile(value: unknown): value is CharacterProfile {
  return typeof value === 'object' && value !== null && 'id' in value && 'name' in value;
}

export class CharacterRegistry {
  private static instance: CharacterRegistry | undefined;
  private readonly characters = new Map<string, CharacterProfile>();
  private loaded = false;
  private readonly dataDir: string;

  private constructor(dataDir?: string) {
    if (typeof dataDir === 'string' && dataDir.length > 0) {
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
      const found: string | undefined = candidates.find(p => existsSync(p));
      if (found === undefined) {
        this.dataDir = candidates[candidates.length - 1];
      } else {
        this.dataDir = found;
      }
    }
  }

  public static getInstance(dataDir?: string): CharacterRegistry {
    CharacterRegistry.instance ??= new CharacterRegistry(dataDir);
    return CharacterRegistry.instance;
  }

  public load(force = false): void {
    if (this.loaded === true && force === false) { return; }
    this.characters.clear();
    try {
      const files = readdirSync(this.dataDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const raw = readFileSync(path.join(this.dataDir, file), 'utf-8');
          const parsedRaw: unknown = JSON.parse(raw);
          if (isCharacterProfile(parsedRaw) && parsedRaw.id !== '' && parsedRaw.name !== '') {
            const parsed = parsedRaw; // narrowed
            this.characters.set(parsed.id, parsed);
          }
        } catch (err) {
          logger.error(`Failed to load character file ${file}`, err);
        }
      }
      this.loaded = true;
      if (this.characters.size === 0) {
        logger.warn(`[CharacterRegistry] No characters loaded from ${this.dataDir}`);
      }
    } catch (e) {
      logger.error('CharacterRegistry load error', e, 'dir:', this.dataDir);
    }
  }

  public list(): CharacterProfile[] {
    if (this.loaded === false) { this.load(); }
    return Array.from(this.characters.values());
  }

  public get(id: string): CharacterProfile | undefined {
    if (this.loaded === false) { this.load(); }
    return this.characters.get(id);
  }
}
