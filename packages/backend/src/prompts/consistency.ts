import type { MemoryRetrievalResult } from '@rpg/types';
import { config } from '../config.js';

export interface ConsistencyDecisionInput {
  sessionId?: string;
  userMessage: string;
  memory: MemoryRetrievalResult;
  templateId: 'default' | 'roleplay' | 'consistency_maintenance';
}

export type ConsistencyDecisionReason = 'session_start' | 'user_cue' | 'turn_interval' | 'time_interval';

interface SessionState {
  lastInjectionTurnIndex: number;
  lastInjectionTime: number; // epoch ms
}

const sessionState = new Map<string, SessionState>();

function countAssistantTurns(memory: MemoryRetrievalResult): number {
  return memory.l1.turns.filter((t: { role: string }) => t.role === 'assistant').length;
}

function userCueDetected(userMessage: string): boolean {
  const cues = [
    'stay in character',
    "don't break character",
    'do not break character',
    "you're out of character",
    'you are out of character',
    'stay consistent',
    'be consistent'
  ];
  const msg = userMessage.toLowerCase();
  return cues.some(c => msg.includes(c));
}

export function getConsistencyFragment(charName?: string): string {
  const who = charName ?? 'Assistant';
  return `((OOC: Remember, you are ${who}. Maintain established personality and speaking style.))`;
}

export class ConsistencyInjector {
  static shouldInject(input: ConsistencyDecisionInput): { inject: boolean; reason?: ConsistencyDecisionReason } {
    if (!config.PROMPT_CONSISTENCY_ENABLED) return { inject: false };

    // Only meaningful for roleplay-style prompts
    if (input.templateId !== 'roleplay') return { inject: false };

    const interval = config.PROMPT_CONSISTENCY_TURN_INTERVAL;
    const cooldown = config.PROMPT_CONSISTENCY_COOLDOWN_TURNS;
    const timeMinutes = config.PROMPT_CONSISTENCY_TIME_MINUTES;

    const totalAssistantTurns = countAssistantTurns(input.memory);

    const key = input.sessionId ?? 'global';
    const now = Date.now();
    const state = sessionState.get(key) ?? { lastInjectionTurnIndex: -Infinity, lastInjectionTime: 0 };

    const turnsSinceLast = totalAssistantTurns - state.lastInjectionTurnIndex;
    const minutesSinceLast = state.lastInjectionTime === 0 ? Infinity : (now - state.lastInjectionTime) / 60000;

    // Session start: inject once at the first assistant turn
    if (totalAssistantTurns === 0) {
      sessionState.set(key, { lastInjectionTurnIndex: 0, lastInjectionTime: now });
      return { inject: true, reason: 'session_start' };
    }

    // User cue overrides cadence as long as cooldown is satisfied
    if (userCueDetected(input.userMessage)) {
      if (turnsSinceLast >= cooldown) {
        sessionState.set(key, { lastInjectionTurnIndex: totalAssistantTurns, lastInjectionTime: now });
        return { inject: true, reason: 'user_cue' };
      }
    }

    // Turn-interval cadence with cooldown
    if (interval > 0 && totalAssistantTurns > 0 && totalAssistantTurns % interval === 0) {
      if (turnsSinceLast >= cooldown) {
        sessionState.set(key, { lastInjectionTurnIndex: totalAssistantTurns, lastInjectionTime: now });
        return { inject: true, reason: 'turn_interval' };
      }
    }

    // Time-based cadence with cooldown
    if (timeMinutes > 0 && minutesSinceLast >= timeMinutes && turnsSinceLast >= cooldown) {
      sessionState.set(key, { lastInjectionTurnIndex: totalAssistantTurns, lastInjectionTime: now });
      return { inject: true, reason: 'time_interval' };
    }

    return { inject: false };
  }
}
