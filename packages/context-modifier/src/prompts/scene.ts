/**
 * Scene context generation from active modifiers.
 */

export function buildSceneContext(activeModifierIds: string[]): string {
  if (activeModifierIds.length === 0) return 'Default casual conversation setting.';
  // Simple heuristic mapping; later this could be replaced by richer templates.
  const hints: string[] = [];
  if (activeModifierIds.some((id: string) => id.includes('romantic'))) hints.push('Subtle warmth and interpersonal closeness in the air.');
  if (activeModifierIds.some((id: string) => id.includes('conflict'))) hints.push('Tension noticeable; emotional stakes slightly elevated.');
  if (activeModifierIds.some((id: string) => id.includes('playful'))) hints.push('Light, teasing energy encourages humor.');
  if (hints.length === 0) return 'Ambient neutral setting.';
  return hints.join(' ');
}
