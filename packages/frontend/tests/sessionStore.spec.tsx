import { describe, it, expect } from 'vitest';
import { useSessionStore } from '../src/state/sessionStore';

describe('sessionStore', () => {
  it('toggles auth state on login/logout', () => {
    const { login, logout } = useSessionStore.getState();
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
    login('test@example.com', 'pw');
    expect(useSessionStore.getState().isAuthenticated).toBe(true);
    expect(useSessionStore.getState().userEmail).toBe('test@example.com');
    logout();
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
  });
  it('elevates admin flag', () => {
    const { elevate } = useSessionStore.getState();
    expect(useSessionStore.getState().isAdmin).toBe(false);
    elevate();
    expect(useSessionStore.getState().isAdmin).toBe(true);
  });
});
