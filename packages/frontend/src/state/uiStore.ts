import { create } from 'zustand';

type AuthModal = 'login' | 'register' | null;

interface UIState {
  authModal: AuthModal;
  openAuth: (which: Exclude<AuthModal, null>) => void;
  closeAuth: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  authModal: null,
  openAuth: (which) => set({ authModal: which }),
  closeAuth: () => set({ authModal: null }),
}));
