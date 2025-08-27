import { create } from 'zustand';
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

function makeRepoStore<T extends { id: string; createdAt: number; updatedAt: number }>(): RepoState<T> & { getState: () => RepoState<T> } {
  const store = create<RepoState<T>>((set, get: () => RepoState<T>) => ({
    items: {} as Record<string, T>,
    upsert: (entity: T): void => {
      set((s: RepoState<T>) => {
        const exists = Object.prototype.hasOwnProperty.call(s.items, entity.id);
        void postNarrativeEvent({
          type: exists ? 'entity_updated' : 'entity_created',
          payload: { id: entity.id, kind: 'generic', updatedAt: entity.updatedAt }
        });
        const nextItems: Record<string, T> = { ...s.items, [entity.id]: entity };
        return { items: nextItems } as Partial<RepoState<T>>;
      });
    },
    remove: (id: string): void => {
      set((s: RepoState<T>) => {
        const next: Record<string, T> = {};
        for (const key in s.items) {
          if (Object.prototype.hasOwnProperty.call(s.items, key) && key !== id) {
            next[key] = s.items[key];
          }
        }
        return { items: next } as Partial<RepoState<T>>;
      });
    },
    get: (id: string): T | undefined => get().items[id],
    all: (): T[] => {
      const values: T[] = Object.values(get().items);
      return values.sort((a, b) => b.updatedAt - a.updatedAt);
    },
    clear: (): void => { set({ items: {} as Record<string, T> }); }
  }));
  // Expose state snapshot plus getter (previous API contract)
  const snapshot = store.getState();
  return { ...snapshot, getState: store.getState };
}

export const useCharacterRepo = makeRepoStore<Character>();
export const useSettingRepo = makeRepoStore<Setting>();
export const useLocationRepo = makeRepoStore<Location>();
export const useObjectRepo = makeRepoStore<ObjectAsset>();

// Typed schema parse helpers to avoid any widening triggering unsafe-member-access
const parseWith = <T>(schema: ZodType<T>, data: unknown): T => schema.parse(data);
export const validateCharacter = (data: unknown): Character => parseWith<Character>(CharacterSchema as ZodType<Character>, data);
export const validateSetting = (data: unknown): Setting => parseWith<Setting>(SettingSchema as ZodType<Setting>, data);
export const validateLocation = (data: unknown): Location => parseWith<Location>(LocationSchema as ZodType<Location>, data);
export const validateObjectAsset = (data: unknown): ObjectAsset => parseWith<ObjectAsset>(ObjectAssetSchema as ZodType<ObjectAsset>, data);

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
