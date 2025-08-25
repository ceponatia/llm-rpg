// Context Modifier Zod Schemas
import { z } from "zod";
import { vADStateSchema } from "./common.zod.js";
// Intent enumeration for user message analysis
export const intentSchema = z.enum([
    "romantic",
    "conflict",
    "sexual",
    "annoyed",
    "playful",
    "serious",
    "sad",
    "excited",
    "neutral"
]);
// Intent detection rule for keyword/pattern matching
export const intentDetectionRuleSchema = z.object({
    intent: intentSchema,
    keywords: z.array(z.string()),
    patterns: z.array(z.string()),
    confidence_threshold: z.number().min(0).max(1),
    priority: z.number().int().min(1)
});
// Modifier fragment - pieces of prompt modification
export const modifierFragmentSchema = z.object({
    id: z.string(),
    text: z.string(),
    priority: z.number().int().min(1),
    conditions: z.array(z.string()).optional(),
    intensity_multiplier: z.number().min(0).max(2).default(1.0),
    emotional_impact: vADStateSchema.optional()
});
// Persona definition - static character baseline
export const personaDefinitionSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    personality_traits: z.array(z.string()),
    background: z.string(),
    speaking_style: z.string(),
    base_emotional_state: vADStateSchema,
    system_prompt_template: z.string(),
    example_responses: z.array(z.string()).optional()
});
// Modifier state - current active modifiers
export const modifierStateSchema = z.object({
    active_modifiers: z.record(z.string(), z.object({
        intensity: z.number().min(0).max(1),
        persistence_turns: z.number().int().min(0),
        decay_rate: z.number().min(0).max(1).default(0.1)
    })),
    current_emotional_state: vADStateSchema,
    last_intent: intentSchema.optional(),
    turn_count: z.number().int().min(0).default(0),
    updated_at: z.string()
});
// Prompt parts - decomposed components
export const promptPartsSchema = z.object({
    persona_text: z.string(),
    modifier_text: z.string(),
    rag_context: z.array(z.string()).optional(),
    emotional_context: z.string().optional(),
    scene_context: z.string().optional()
});
// Context modifier configuration
export const contextModifierConfigSchema = z.object({
    intent_detection_rules: z.array(intentDetectionRuleSchema),
    modifier_mappings: z.record(intentSchema, z.array(z.string())), // intent -> modifier IDs
    global_modifiers: z.record(z.string(), modifierFragmentSchema),
    default_persona_id: z.string(),
    state_persistence_turns: z.number().int().min(1).default(10),
    decay_enabled: z.boolean().default(true)
});
// Modifier application result
export const modifierApplicationSchema = z.object({
    applied_modifiers: z.array(z.string()),
    final_intensity: z.number().min(0).max(1),
    emotional_adjustment: vADStateSchema.optional(),
    prompt_additions: z.array(z.string())
});
