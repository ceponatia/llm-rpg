import { create } from 'zustand';

interface MemoryEventBase { type: string; timestamp?: string; [k: string]: any }

interface WSState {
  connected: boolean;
  lastMessage?: MemoryEventBase;
  events: MemoryEventBase[];
  error?: string;
  connect: () => void;
  disconnect: () => void;
  clear: () => void;
}

const WS_PATH = '/ws/updates';
const API_BASE = (import.meta.env.VITE_MEMORY_API || 'http://localhost:3001').replace(/\/$/, '');

export const useWSStore = create<WSState>((set, get) => ({
  connected: false,
  events: [],
  connect: () => {
    if (get().connected) return;
    try {
      const wsUrl = API_BASE.replace(/^http/, 'ws') + WS_PATH;
      const socket = new WebSocket(wsUrl);
      (window as any).__MEMORY_WS__ = socket;
      socket.onopen = () => {
        set({ connected: true, error: undefined });
        socket.send(JSON.stringify({ type: 'subscribe_to_memory_operations' }));
        socket.send(JSON.stringify({ type: 'subscribe_to_emotional_changes' }));
      };
      socket.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          set(s => ({ lastMessage: data, events: [...s.events.slice(-199), data] }));
        } catch {
          // ignore parse errors
        }
      };
      socket.onerror = () => {
        set({ error: 'WebSocket error' });
      };
      socket.onclose = () => {
        set({ connected: false });
      };
    } catch (e: any) {
      set({ error: e.message });
    }
  },
  disconnect: () => {
    const g: any = (window as any).__MEMORY_WS__;
    if (g && g.readyState < 2) {
      g.close();
    }
  },
  clear: () => set({ events: [], lastMessage: undefined })
}));
