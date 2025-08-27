import { postNarrativeEvent } from '../services/memoryClient';
import type { ZodType } from 'zod';
import {
  panelCharacterSchema as CharacterSchema,
  panelSettingSchema as SettingSchema,
  panelLocationSchema as LocationSchema,
  panelObjectAssetSchema as ObjectAssetSchema,
  type PanelCharacter as Character,
  type PanelSetting as Setting,
  type PanelLocation as Location,
  type PanelObjectAsset as ObjectAsset,
} from '@rpg/types';

interface RepoState<T extends { id: string; createdAt: number; updatedAt: number }> {
  items: Record<string, T>;
  upsert: (entity: T) => void;
  remove: (id: string) => void;
  all: () => T[];
  get: (id: string) => T | undefined;
  clear: () => void;
}

function makeRepoStore<T extends { id: string; createdAt: number; updatedAt: number }>(): RepoState<T> {
  let items: Record<string, T> = {};
  const api: RepoState<T> = {
    get items() { return items; },
    upsert: (entity: T) => {
      const exists = Object.prototype.hasOwnProperty.call(items, entity.id);
      void postNarrativeEvent({
        type: exists ? 'entity_updated' : 'entity_created',
        payload: { id: entity.id, kind: 'generic', updatedAt: entity.updatedAt }
      });
      items = { ...items, [entity.id]: entity };
    },
    remove: (id: string) => {
      const next: Record<string, T> = {};
      for (const key in items) {
        if (Object.prototype.hasOwnProperty.call(items, key) && key !== id) {
          next[key] = items[key];
        }
      }
      items = next;
    },
    get: (id: string) => items[id],
  all: () => Object.values(items).sort((a, b) => b.updatedAt - a.updatedAt),
    clear: () => { items = {}; }
  };
  return api;
}

export const useCharacterRepo: RepoState<Character> = makeRepoStore<Character>();
export const useSettingRepo: RepoState<Setting> = makeRepoStore<Setting>();
export const useLocationRepo: RepoState<Location> = makeRepoStore<Location>();
export const useObjectRepo: RepoState<ObjectAsset> = makeRepoStore<ObjectAsset>();

// Typed schema parse helpers using safeParse to avoid unsafe member access patterns
const parseWith = <T>(schema: ZodType<T>) => (data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) throw new Error(result.error.message);
  return result.data;
};
export const validateCharacter = parseWith(CharacterSchema as ZodType<Character>);
export const validateSetting = parseWith(SettingSchema as ZodType<Setting>);
export const validateLocation = parseWith(LocationSchema as ZodType<Location>);
export const validateObjectAsset = parseWith(ObjectAssetSchema as ZodType<ObjectAsset>);

export interface ImportResult<T> {
  ok: boolean;
  data: T[];
  errors: { index: number; error: string }[];
}

export function safeParseArray<T>(schema: ZodType<T>, arr: unknown[]): ImportResult<T> {
  const data: T[] = [];
  const errors: { index: number; error: string }[] = [];
  arr.forEach((raw, idx) => {
    const result = schema.safeParse(raw);
    if (result.success) data.push(result.data);
    else errors.push({ index: idx, error: result.error.message });
  });
  return { ok: errors.length === 0, data, errors };
}
