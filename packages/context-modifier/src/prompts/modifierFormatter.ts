/**
 * Formatter utilities for modifier fragments & intensities.
 */
import type { ModifierFragment } from '../../../types/src/zod/contextModifier.zod.js';

export function formatActiveModifiers(fragments: ModifierFragment[], intensities: Record<string, number>): string {
  if (fragments.length === 0) return 'None';
  return fragments
    .map((f: ModifierFragment) => {
      const intensity: number = intensities[f.id] ?? 0;
      const scaled: string = (intensity * (f.intensity_multiplier ?? 1)).toFixed(2);
      return `#${f.priority} ${f.id} (intensity ${scaled}) -> ${f.text}`;
    })
    .join('\n');
}
