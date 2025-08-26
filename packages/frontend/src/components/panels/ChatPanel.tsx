import React from 'react';
import { useChatStore } from '../../state/chatStore';
import { isEnabled } from '../../utils/flags';

export const ChatPanel: React.FC = () => {
  if (!isEnabled('FRONTEND_CHAT_ENABLED')) return null;
  const { turns, send, sending, error, affection, lastIntent } = useChatStore();
  const [text, setText] = React.useState('');
  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); void send(text); setText(''); };
  return (
    <div className="rounded-lg border border-twilight-700 bg-twilight-900/60 p-4 space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">Chat</h2>
      <div className="h-56 overflow-y-auto space-y-2 text-sm pr-1 bg-twilight-900/40 p-2 rounded">
        {turns.length === 0 && <p className="text-twilight-500">Start the conversation…</p>}
        {turns.map(t => (
          <div key={t.id} className={t.role === 'assistant' ? 'text-accent-300' : 'text-twilight-200'}>
            <span className="font-mono text-xs mr-1">{t.role === 'assistant' ? 'A' : 'U'}:</span>
            {t.content}
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-twilight-400">
          <span>Affection</span>
          <span className="font-mono">{affection}</span>
        </div>
        <div className="w-full h-2 bg-twilight-800 rounded overflow-hidden">
          <div className="h-full bg-accent-600 transition-all" style={{ width: `${affection}%` }} />
        </div>
        {lastIntent && <p className="text-[10px] text-twilight-500">Last intent: <span className="text-twilight-300">{lastIntent}</span></p>}
      </div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          className="flex-1 rounded bg-twilight-800 border border-twilight-600 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-accent-500"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message"
          disabled={sending}
        />
        <button disabled={sending || text.trim()===''} className="px-3 py-1 rounded bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-sm">Send</button>
      </form>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {sending && <p className="text-xs text-twilight-500">Sending…</p>}
      <p className="text-[10px] uppercase tracking-wide text-twilight-500">Feature Flag: FRONTEND_CHAT_ENABLED</p>
    </div>
  );
};
