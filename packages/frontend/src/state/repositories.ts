import { create } from 'zustand';
import { postNarrativeEvent } from '../services/memoryClient';
import { z } from 'zod';
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

function makeRepoStore<T extends { id: string; createdAt: number; updatedAt: number }>() {
  return create<RepoState<T>>((set, get) => ({
    items: {},
    upsert: (entity) =>
      set((s) => {
        const exists = !!s.items[entity.id];
        postNarrativeEvent({
          type: exists ? 'entity_updated' : 'entity_created',
          payload: { id: entity.id, kind: 'generic', updatedAt: entity.updatedAt }
        }).catch(() => {});
        return { items: { ...s.items, [entity.id]: entity } };
      }),
    remove: (id) => set((s) => {
      const next = { ...s.items };
      delete next[id];
      return { items: next };
    }),
    get: (id) => get().items[id],
    all: () => Object.values(get().items).sort((a, b) => b.updatedAt - a.updatedAt),
    clear: () => set({ items: {} }),
  }));
}

export const useCharacterRepo = makeRepoStore<Character>();
export const useSettingRepo = makeRepoStore<Setting>();
export const useLocationRepo = makeRepoStore<Location>();
export const useObjectRepo = makeRepoStore<ObjectAsset>();

export const validateCharacter = (data: unknown) => CharacterSchema.parse(data);
export const validateSetting = (data: unknown) => SettingSchema.parse(data);
export const validateLocation = (data: unknown) => LocationSchema.parse(data);
export const validateObjectAsset = (data: unknown) => ObjectAssetSchema.parse(data);

export interface ImportResult<T> {
  ok: boolean;
  data: T[];
  errors: { index: number; error: string }[];
}

export function safeParseArray<T>(schema: z.ZodType<T>, arr: unknown[]): ImportResult<T> {
  const data: T[] = [];
  const errors: { index: number; error: string }[] = [];
  arr.forEach((raw, idx) => {
    const result = schema.safeParse(raw);
    if (result.success) data.push(result.data);
    else errors.push({ index: idx, error: result.error.message });
  });
  return { ok: errors.length === 0, data, errors };
}
