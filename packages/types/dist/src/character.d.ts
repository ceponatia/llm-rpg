import type { VADState } from './common.js';
export type AttributeCategory = 'physical' | 'personality' | 'background' | 'abilities' | 'preferences' | 'speech' | 'meta';
export type AttributePrimitive = string | number | boolean;
export interface AttributeScalar {
    value: AttributePrimitive;
    unit?: string;
}
export interface CharacterAttribute {
    key: string;
    category: AttributeCategory;
    value: AttributePrimitive | AttributeScalar;
    aliases?: Array<string>;
    salience?: number;
    confidence?: number;
    lastUpdated?: string;
}
export interface CharacterProfile {
    id: string;
    name: string;
    description?: string;
    avatar_url?: string;
    baseline_vad?: VADState;
    attributes?: Array<CharacterAttribute>;
}
