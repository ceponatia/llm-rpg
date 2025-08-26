import { create } from 'zustand';
import { sendChat, type ChatMessageResponse } from '../services/memoryClient';
import { isEnabled } from '../utils/flags';
// Minimal inline intent detection (subset) to avoid cross-package build coupling for Sprint 1
type MiniIntent = 'neutral' | 'excited' | 'annoyed';
const INTENT_KEYWORDS: Record<MiniIntent, string[]> = {
  neutral: [],
  excited: ['love','great','awesome','wow','yay'],
  annoyed: ['boring','annoying','stupid','hate']
};
function detectIntent(text: string): MiniIntent {
  const lower = text.toLowerCase();
  for (const kw of INTENT_KEYWORDS.excited) { if (lower.includes(kw)) return 'excited'; }
  for (const kw of INTENT_KEYWORDS.annoyed) { if (lower.includes(kw)) return 'annoyed'; }
  return 'neutral';
}

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

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
  async send(text: string) {
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
    const intent = detectIntent(trimmed);
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
        id: res.id || `assistant-${Date.now()}`,
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
    } catch (e: any) {
      set({ error: e.message || 'Failed to send', sending: false });
    }
  },
  clear() { set({ turns: [], sessionId: undefined, error: undefined, affection: 50, lastIntent: undefined }); }
}));
