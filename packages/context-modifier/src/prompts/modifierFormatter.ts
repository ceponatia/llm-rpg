/**
 * Formatter utilities for modifier fragments & intensities.
 */
import type { ModifierFragment } from '../../../types/src/zod/contextModifier.zod.js';

export function formatActiveModifiers(fragments: Array<ModifierFragment>, intensities: Record<string, number>): string {
  if (fragments.length === 0) { return 'None'; }
  return fragments
    .map((f: ModifierFragment) => {
      const intensity: number = Object.prototype.hasOwnProperty.call(intensities, f.id) ? intensities[f.id] : 0;
  const multiplier = f.intensity_multiplier; // always defined via schema default
      const scaled: string = (intensity * multiplier).toFixed(2);
      return `#${f.priority} ${f.id} (intensity ${scaled}) -> ${f.text}`;
    })
    .join('\n');
}
