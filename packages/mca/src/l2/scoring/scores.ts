// L2 relevance scoring and token estimation utilities
import type { Character, FactNode, RelationshipEdge } from '@rpg/types';

export function calculateL2RelevanceScore(
  characters: Array<Character>, 
  facts: Array<FactNode>, 
  relationships: Array<RelationshipEdge>
): number {
  const totalItems = characters.length + facts.length + relationships.length;
  if (totalItems === 0) {return 0;}

  // Simple relevance calculation based on matches
  return Math.min(1.0, totalItems / 10); // Normalized to max of 1.0
}

export function estimateL2TokenCount(
  characters: Array<Character>, 
  facts: Array<FactNode>, 
  relationships: Array<RelationshipEdge>
): number {
  let tokenCount = 0;
  
  // Rough estimation: 50 tokens per character, 30 per fact, 25 per relationship
  tokenCount += characters.length * 50;
  tokenCount += facts.length * 30;
  tokenCount += relationships.length * 25;
  
  return tokenCount;
}