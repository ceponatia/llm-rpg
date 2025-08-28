import { create } from 'zustand';
import { sendChat, type ChatMessageResponse } from '../services/memoryClient';
import type { ChatTurn } from '@rpg/types';
import { isEnabled } from '../utils/flags';
import { IntentDetector } from '@rpg/context-modifier';

// Singleton intent detector (lightweight). Rule set mirrors previous keyword logic.
const intentDetector = new IntentDetector({
  defaultIntent: 'neutral',
  confidenceThreshold: 0, // allow any match
  enableFallback: true,
  rules: [
    { intent: 'excited', keywords: ['love','great','awesome','wow','yay'], patterns: [], confidence_threshold: 0, priority: 1 },
    { intent: 'annoyed', keywords: ['boring','annoying','stupid','hate'], patterns: [], confidence_threshold: 0, priority: 1 }
  ]
});

interface ChatState {
  sessionId?: string;
  turns: ChatTurn[];
  sending: boolean;
  error?: string;
  affection: number;
  lastIntent?: string;
  send: (text: string) => Promise<void>;
  clear: () => void;
}

function clamp(v: number, min: number, max: number): number { return Math.min(Math.max(v, min), max); }

export const useChatStore = create<ChatState>((set, get) => ({
  sessionId: undefined,
  turns: [],
  sending: false,
  error: undefined,
  affection: 50,
  lastIntent: undefined,
  async send(text: string): Promise<void> {
    if (!isEnabled('FRONTEND_CHAT_ENABLED')) {
      set({ error: 'Chat disabled' });
      return;
    }
    const trimmed = text.trim();
    if (trimmed === '') return;
    const now = new Date().toISOString();
    const tempId = `local-${Date.now()}`;
    // optimistic user turn
    // Detect intent on user message
  const detection = intentDetector.detectIntent(trimmed);
  const intent = detection.intent;
  const delta = intent === 'excited' ? 2 : intent === 'annoyed' ? -2 : 0;
    set(s => ({
      turns: [...s.turns, { id: tempId, role: 'user', content: trimmed, timestamp: now }],
      error: undefined,
      lastIntent: intent,
      affection: clamp(s.affection + delta, 0, 100)
    }));
    set({ sending: true });
    try {
      const res: ChatMessageResponse = await sendChat(trimmed, get().sessionId);
      const sid = res.sessionId;
      const replyContent = res.reply;
      const replyTurn: ChatTurn = {
  id: res.id ?? `assistant-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toISOString()
      };
      // Optionally detect intent on assistant (could influence future logic; not altering affection now)
      set(s => ({
        sessionId: sid,
        turns: s.turns.concat(replyTurn),
        sending: false
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to send';
      set({ error: msg, sending: false });
    }
  },
  clear(): void { set({ turns: [], sessionId: undefined, error: undefined, affection: 50, lastIntent: undefined }); }
}));
