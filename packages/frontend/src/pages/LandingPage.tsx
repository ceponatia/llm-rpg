import { AuthModals } from '../components/auth/AuthModals';
import { useUIStore } from '../state/uiStore';
import type { FC } from 'react';

export const LandingPage: FC = () => {
  const { openAuth } = useUIStore();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 bg-gradient-to-b from-twilight-950 via-twilight-900 to-twilight-800">
      <header className="text-center space-y-4">
        <h1 className="text-5xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-accent-600 to-accent-400 drop-shadow">Story Engine</h1>
        <p className="text-twilight-200 max-w-xl mx-auto">
          A discreet creative companion for crafting engaging narrative scenes and interactive dialogues—locally powered and privacy-first.
        </p>
      </header>
      <div className="flex gap-4">
        <button onClick={() => openAuth('login')} className="px-6 py-3 rounded-md bg-accent-600 hover:bg-accent-500 shadow-glow transition font-medium">Sign In</button>
        <button onClick={() => openAuth('register')} className="px-6 py-3 rounded-md border border-accent-600/60 hover:bg-accent-600/10 transition font-medium">Create Account</button>
      </div>
      <AuthModals />
    </main>
  );
};
