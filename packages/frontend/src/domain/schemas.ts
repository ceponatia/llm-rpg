// Re-export unified schemas from shared types package for transitional compatibility.
export {
  panelIdSchema as IdSchema,
  panelUnixTimestampSchema as TimestampSchema,
  panelTagSchema as TagSchema,
  panelCharacterSchema as CharacterSchema,
  panelSettingSchema as SettingSchema,
  panelLocationSchema as LocationSchema,
  panelObjectAssetSchema as ObjectAssetSchema,
  panelConversationTurnSchema as ConversationTurnSchema,
} from '@rpg/types';

export type {
  PanelCharacter as Character,
  PanelSetting as Setting,
  PanelLocation as Location,
  PanelObjectAsset as ObjectAsset,
  PanelConversationTurn as ConversationTurn,
} from '@rpg/types';

export const DomainSchemas = {
  // Transitional export mapping to new shared schemas
  CharacterSchema: undefined, // deprecated
  SettingSchema: undefined,
  LocationSchema: undefined,
  ObjectAssetSchema: undefined,
  ConversationTurnSchema: undefined,
};
