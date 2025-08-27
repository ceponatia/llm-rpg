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
  const store = create<RepoState<T>>((set, get) => ({
    items: {},
    upsert: (entity: T): void => {
      set((s) => {
        const exists = Object.hasOwn(s.items, entity.id);
        void postNarrativeEvent({
          type: exists ? 'entity_updated' : 'entity_created',
          payload: { id: entity.id, kind: 'generic', updatedAt: entity.updatedAt }
        });
        return { items: { ...s.items, [entity.id]: entity } };
      });
    },
    remove: (id: string): void => {
      set((s) => {
        // Destructure to omit the id without using Object.entries (avoids any widening)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _removed, ...rest } = s.items;
        return { items: rest };
      });
    },
    get: (id: string): T | undefined => {
      const state = get();
      return state.items[id];
    },
  all: (): T[] => {
      const state = get();
      return Object.values(state.items).sort((a, b) => b.updatedAt - a.updatedAt);
    },
    clear: (): void => { set({ items: {} }); }
  }));
  return { ...store.getState(), getState: store.getState };
}

export const useCharacterRepo = makeRepoStore<Character>();
export const useSettingRepo = makeRepoStore<Setting>();
export const useLocationRepo = makeRepoStore<Location>();
export const useObjectRepo = makeRepoStore<ObjectAsset>();

export const validateCharacter = (data: unknown): Character => CharacterSchema.parse(data);
export const validateSetting = (data: unknown): Setting => SettingSchema.parse(data);
export const validateLocation = (data: unknown): Location => LocationSchema.parse(data);
export const validateObjectAsset = (data: unknown): ObjectAsset => ObjectAssetSchema.parse(data);

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
