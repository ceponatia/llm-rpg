import { create } from 'zustand';

interface SessionState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userEmail?: string;
  login: (email: string, password: string) => void;
  register: (email: string, password: string, code?: string) => void;
  logout: () => void;
  elevate: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isAuthenticated: false,
  isAdmin: false,
  userEmail: undefined,
  login: (email) => set({ isAuthenticated: true, userEmail: email }),
  register: (email) => set({ isAuthenticated: true, userEmail: email }),
  logout: () => set({ isAuthenticated: false, userEmail: undefined, isAdmin: false }),
  elevate: () => set((s) => ({ isAdmin: !s.isAdmin })),
}));
