// Prompt templates and simple renderer for backend
// Centralizes core system prompts and supports dynamic memory-context injection

export type PromptTemplateId = 'default' | 'roleplay' | 'consistency_maintenance';

export interface TemplateVars {
  char?: string;
  user?: string;
  scene?: string;
}

const templates: Record<PromptTemplateId, string> = {
  // Matches the existing behavior: base instruction only. Memory sections and
  // response instruction are appended dynamically by the service.
  default:
    `You are an AI assistant with access to a sophisticated memory system. Use the provided context to give relevant, personalized responses.

{{MEMORY_CONTEXT}}`,

  // Role-playing template based on docs/prompts.md. Memory is injected into the
  // [INST] block via {{MEMORY_CONTEXT}}.
  roleplay:
    `<s>[INST]
ROLEPLAY INSTRUCTIONS:
You are roleplaying as {{char}}. {{char}} refers to YOU, the AI character. {{user}} refers to the human user.

MEMORY CONTEXT:
{{MEMORY_CONTEXT}}

Current scene: {{scene}}
Respond as {{char}} would, staying true to their character:
[/INST]`,

  // Character consistency reinforcement. Injects a brief OOC reminder, then memory.
  consistency_maintenance:
    `((OOC: Remember, you are {{char}}. Maintain established personality and speaking style.))

{{MEMORY_CONTEXT}}`
};

export function renderTemplate(
  id: PromptTemplateId,
  vars: TemplateVars = {}
): string {
  const base = templates[id];
  return base
    .replace(/\{\{char\}\}/g, vars.char ?? 'Assistant')
    .replace(/\{\{user\}\}/g, vars.user ?? 'User')
    .replace(/\{\{scene\}\}/g, vars.scene ?? '')
    // Memory context is injected later; keep the token if present for detection
    ;
}

export function hasMemorySlot(template: string): boolean {
  return template.includes('{{MEMORY_CONTEXT}}');
}

export function injectMemory(template: string, memoryBlock: string): string {
  if (hasMemorySlot(template)) {
    return template.replace('{{MEMORY_CONTEXT}}', memoryBlock);
  }
  // If the template doesn't specify, append at the end with spacing
  return `${template}\n\n${memoryBlock}`;
}
