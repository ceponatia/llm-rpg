import { create } from 'zustand';

// Minimal event representation; refine as backend schemas stabilize
// Use unknown instead of any for event payload fields to encourage narrowing at use sites
interface MemoryEventBase { type: string; timestamp?: string; [k: string]: unknown }

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
const API_BASE = (import.meta.env.VITE_MEMORY_API ?? 'http://localhost:3001').replace(/\/$/, '');

export const useWSStore = create<WSState>((set, get) => ({
  connected: false,
  events: [],
  connect: (): void => {
    if (get().connected) return;
    try {
      const wsUrl = API_BASE.replace(/^http/, 'ws') + WS_PATH;
  const socket = new WebSocket(wsUrl);
  (window as unknown as { __MEMORY_WS__?: WebSocket }).__MEMORY_WS__ = socket;
  socket.onopen = (): void => {
        set({ connected: true, error: undefined });
        socket.send(JSON.stringify({ type: 'subscribe_to_memory_operations' }));
        socket.send(JSON.stringify({ type: 'subscribe_to_emotional_changes' }));
      };
      socket.onmessage = (ev: MessageEvent): void => {
        try {
          const parsed: unknown = JSON.parse(ev.data as string);
          if (parsed !== null && typeof parsed === 'object' && Object.prototype.hasOwnProperty.call(parsed, 'type')) {
            const data = parsed as MemoryEventBase;
            set(s => ({ lastMessage: data, events: [...s.events.slice(-199), data] }));
          }
        } catch {
          // ignore parse errors
        }
      };
  socket.onerror = (): void => {
        set({ error: 'WebSocket error' });
      };
  socket.onclose = (): void => {
        set({ connected: false });
      };
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'WebSocket init failed' });
    }
  },
  disconnect: (): void => {
    const g = (window as unknown as { __MEMORY_WS__?: WebSocket }).__MEMORY_WS__;
    if (g && g.readyState < 2) {
      g.close();
    }
  },
  clear: (): void => set({ events: [], lastMessage: undefined })
}));
