import { useSessionStore } from '../state/sessionStore';
import { LibraryPanel, AdminPanel, ChatPanel } from '../components/panels';
import { useWSStore } from '../state/wsStore';
import type { FC } from 'react';

export const Dashboard: FC = () => {
  const { userEmail, isAdmin, logout, elevate } = useSessionStore();
  const { connected, connect, disconnect, lastMessage } = useWSStore();
  if (!connected) {
    connect();
  }
  return (
    <div className="min-h-screen bg-twilight-950 text-twilight-50 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-twilight-700 bg-twilight-900/60 backdrop-blur">
        <h1 className="text-xl font-semibold tracking-tight">Story Engine</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-twilight-300">{userEmail}</span>
          <button onClick={logout} className="px-3 py-1 rounded bg-twilight-700 hover:bg-twilight-600">Logout</button>
          <button onClick={elevate} className="px-3 py-1 rounded border border-accent-600/60 hover:bg-accent-600/10">{isAdmin ? 'Normal' : 'Admin'}</button>
        </div>
      </header>
      <main className="flex-1 grid md:grid-cols-3 gap-6 p-6">
        <section className="md:col-span-2 space-y-6">
          <LibraryPanel />
          <ChatPanel />
          <div className="rounded border border-twilight-700 p-3 text-xs bg-twilight-900/60 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Memory Stream</span>
              <button onClick={connected ? disconnect : connect} className="px-2 py-1 rounded bg-twilight-700 hover:bg-twilight-600">
                {connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
            <div className="text-twilight-300 min-h-[2rem]">
              {lastMessage ? <code className="block whitespace-pre-wrap">{JSON.stringify(lastMessage)}</code> : 'No events yet.'}
            </div>
          </div>
        </section>
        <aside className="space-y-6">
          {isAdmin && <AdminPanel />}
        </aside>
      </main>
    </div>
  );
};
