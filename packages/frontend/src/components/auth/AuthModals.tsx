import * as Dialog from '@radix-ui/react-dialog';
import { useUIStore } from '../../state/uiStore';
import { useSessionStore } from '../../state/sessionStore';
import { useState } from 'react';

const baseInput = 'w-full rounded-md bg-twilight-800 border border-twilight-600 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-600/70 text-sm placeholder-twilight-400';

export const AuthModals = () => {
  const { authModal, closeAuth } = useUIStore();
  const { login, register } = useSessionStore();
  const [form, setForm] = useState({ email: '', password: '', code: '' });
  const isOpen = !!authModal;
  const isLogin = authModal === 'login';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      login(form.email, form.password);
    } else {
      register(form.email, form.password, form.code);
    }
    closeAuth();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(o) => !o && closeAuth()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-lg bg-twilight-800 border border-twilight-600 p-6 shadow-glow space-y-4">
          <Dialog.Title className="text-lg font-semibold tracking-tight">
            {isLogin ? 'Sign In' : 'Create Account'}
          </Dialog.Title>
          <form onSubmit={submit} className="space-y-3">
            <input
              className={baseInput}
              placeholder="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <input
              className={baseInput}
              placeholder="Password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            {!isLogin && (
              <input
                className={baseInput}
                placeholder="Invite Code (if required)"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              />
            )}
            <button
              type="submit"
              className="w-full rounded-md bg-accent-600 hover:bg-accent-500 py-2 font-medium transition"
            >
              {isLogin ? 'Enter' : 'Register'}
            </button>
          </form>
          <Dialog.Close className="absolute top-2 right-2 text-sm text-twilight-300 hover:text-accent-400">✕</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
