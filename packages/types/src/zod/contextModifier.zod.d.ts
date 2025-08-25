import { z } from "zod";
export declare const intentSchema: z.ZodEnum<{
    conflict: "conflict";
    romantic: "romantic";
    sexual: "sexual";
    annoyed: "annoyed";
    playful: "playful";
    serious: "serious";
    sad: "sad";
    excited: "excited";
    neutral: "neutral";
}>;
export declare const intentDetectionRuleSchema: z.ZodObject<{
    intent: z.ZodEnum<{
        conflict: "conflict";
        romantic: "romantic";
        sexual: "sexual";
        annoyed: "annoyed";
        playful: "playful";
        serious: "serious";
        sad: "sad";
        excited: "excited";
        neutral: "neutral";
    }>;
    keywords: z.ZodArray<z.ZodString>;
    patterns: z.ZodArray<z.ZodString>;
    confidence_threshold: z.ZodNumber;
    priority: z.ZodNumber;
}, z.core.$strip>;
export declare const modifierFragmentSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
    priority: z.ZodNumber;
    conditions: z.ZodOptional<z.ZodArray<z.ZodString>>;
    intensity_multiplier: z.ZodDefault<z.ZodNumber>;
    emotional_impact: z.ZodOptional<z.ZodObject<{
        valence: z.ZodNumber;
        arousal: z.ZodNumber;
        dominance: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const personaDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    personality_traits: z.ZodArray<z.ZodString>;
    background: z.ZodString;
    speaking_style: z.ZodString;
    base_emotional_state: z.ZodObject<{
        valence: z.ZodNumber;
        arousal: z.ZodNumber;
        dominance: z.ZodNumber;
    }, z.core.$strip>;
    system_prompt_template: z.ZodString;
    example_responses: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const modifierStateSchema: z.ZodObject<{
    active_modifiers: z.ZodRecord<z.ZodString, z.ZodObject<{
        intensity: z.ZodNumber;
        persistence_turns: z.ZodNumber;
        decay_rate: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    current_emotional_state: z.ZodObject<{
        valence: z.ZodNumber;
        arousal: z.ZodNumber;
        dominance: z.ZodNumber;
    }, z.core.$strip>;
    last_intent: z.ZodOptional<z.ZodEnum<{
        conflict: "conflict";
        romantic: "romantic";
        sexual: "sexual";
        annoyed: "annoyed";
        playful: "playful";
        serious: "serious";
        sad: "sad";
        excited: "excited";
        neutral: "neutral";
    }>>;
    turn_count: z.ZodDefault<z.ZodNumber>;
    updated_at: z.ZodString;
}, z.core.$strip>;
export declare const promptPartsSchema: z.ZodObject<{
    persona_text: z.ZodString;
    modifier_text: z.ZodString;
    rag_context: z.ZodOptional<z.ZodArray<z.ZodString>>;
    emotional_context: z.ZodOptional<z.ZodString>;
    scene_context: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const contextModifierConfigSchema: z.ZodObject<{
    intent_detection_rules: z.ZodArray<z.ZodObject<{
        intent: z.ZodEnum<{
            conflict: "conflict";
            romantic: "romantic";
            sexual: "sexual";
            annoyed: "annoyed";
            playful: "playful";
            serious: "serious";
            sad: "sad";
            excited: "excited";
            neutral: "neutral";
        }>;
        keywords: z.ZodArray<z.ZodString>;
        patterns: z.ZodArray<z.ZodString>;
        confidence_threshold: z.ZodNumber;
        priority: z.ZodNumber;
    }, z.core.$strip>>;
    modifier_mappings: z.ZodRecord<z.ZodEnum<{
        conflict: "conflict";
        romantic: "romantic";
        sexual: "sexual";
        annoyed: "annoyed";
        playful: "playful";
        serious: "serious";
        sad: "sad";
        excited: "excited";
        neutral: "neutral";
    }>, z.ZodArray<z.ZodString>>;
    global_modifiers: z.ZodRecord<z.ZodString, z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        priority: z.ZodNumber;
        conditions: z.ZodOptional<z.ZodArray<z.ZodString>>;
        intensity_multiplier: z.ZodDefault<z.ZodNumber>;
        emotional_impact: z.ZodOptional<z.ZodObject<{
            valence: z.ZodNumber;
            arousal: z.ZodNumber;
            dominance: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    default_persona_id: z.ZodString;
    state_persistence_turns: z.ZodDefault<z.ZodNumber>;
    decay_enabled: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const modifierApplicationSchema: z.ZodObject<{
    applied_modifiers: z.ZodArray<z.ZodString>;
    final_intensity: z.ZodNumber;
    emotional_adjustment: z.ZodOptional<z.ZodObject<{
        valence: z.ZodNumber;
        arousal: z.ZodNumber;
        dominance: z.ZodNumber;
    }, z.core.$strip>>;
    prompt_additions: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export type Intent = z.infer<typeof intentSchema>;
export type IntentDetectionRule = z.infer<typeof intentDetectionRuleSchema>;
export type ModifierFragment = z.infer<typeof modifierFragmentSchema>;
export type PersonaDefinition = z.infer<typeof personaDefinitionSchema>;
export type ModifierState = z.infer<typeof modifierStateSchema>;
export type PromptParts = z.infer<typeof promptPartsSchema>;
export type ContextModifierConfig = z.infer<typeof contextModifierConfigSchema>;
export type ModifierApplication = z.infer<typeof modifierApplicationSchema>;
