import { z } from 'zod';

// Shared lightweight domain schemas unified from former frontend `schemas.ts`

export const idSchema = z.string().min(1);
export const unixTimestampSchema = z.number().int().nonnegative();
export const tagSchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-zA-Z0-9-_ ]+$/);

export const panelCharacterSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(60),
  archetype: z.string().min(1).max(80),
  description: z.string().max(400).default(''),
  traits: z.array(z.string().min(1).max(40)).max(15).default([]),
  tags: z.array(tagSchema).max(15).default([]),
  createdAt: unixTimestampSchema,
  updatedAt: unixTimestampSchema,
});

export const panelSettingSchema = z.object({
  id: idSchema,
  title: z.string().min(1).max(80),
  mood: z.string().max(100).default(''),
  summary: z.string().max(500).default(''),
  tags: z.array(tagSchema).max(15).default([]),
  createdAt: unixTimestampSchema,
  updatedAt: unixTimestampSchema,
});

export const panelLocationSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(80),
  settingId: idSchema,
  description: z.string().max(400).default(''),
  ambience: z.string().max(200).default(''),
  tags: z.array(tagSchema).max(15).default([]),
  createdAt: unixTimestampSchema,
  updatedAt: unixTimestampSchema,
});

export const panelObjectAssetSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(80),
  description: z.string().max(400).default(''),
  rarity: z.enum(['common', 'unusual', 'rare', 'epic']).default('common'),
  tags: z.array(tagSchema).max(15).default([]),
  createdAt: unixTimestampSchema,
  updatedAt: unixTimestampSchema,
});

export const panelConversationTurnSchema = z.object({
  id: idSchema,
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  createdAt: unixTimestampSchema,
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type PanelCharacter = z.infer<typeof panelCharacterSchema>;
export type PanelSetting = z.infer<typeof panelSettingSchema>;
export type PanelLocation = z.infer<typeof panelLocationSchema>;
export type PanelObjectAsset = z.infer<typeof panelObjectAssetSchema>;
export type PanelConversationTurn = z.infer<typeof panelConversationTurnSchema>;
