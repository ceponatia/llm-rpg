import { create } from 'zustand';
import { sendChat, type ChatMessageResponse } from '../services/memoryClient';
import { isEnabled } from '../utils/flags';

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
  send: (text: string) => Promise<void>;
  clear: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessionId: undefined,
  turns: [],
  sending: false,
  error: undefined,
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
    set(s => ({ turns: [...s.turns, { id: tempId, role: 'user', content: trimmed, timestamp: now }], error: undefined }));
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
      set(s => ({
        sessionId: sid,
        turns: s.turns.concat(replyTurn),
        sending: false
      }));
    } catch (e: any) {
      set({ error: e.message || 'Failed to send', sending: false });
    }
  },
  clear() { set({ turns: [], sessionId: undefined, error: undefined }); }
}));
