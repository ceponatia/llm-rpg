import React, { useEffect, useRef } from 'react';
import type { ChatTurn } from '@rpg/types';

interface MessageListProps { turns: ChatTurn[]; className?: string; autoScroll?: boolean }

export const useAutoScroll = (deps: unknown[]) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return ref;
};

export const MessageList: React.FC<MessageListProps> = ({ turns, className, autoScroll = true }) => {
  const scrollRef = useAutoScroll([turns.length]);
  return (
    <div ref={autoScroll ? scrollRef : undefined} className={['h-56 overflow-y-auto space-y-2 text-sm pr-1 bg-twilight-900/40 p-2 rounded', className].filter(Boolean).join(' ')} data-testid="message-list">
      {turns.length === 0 && <p className="text-twilight-500">Start the conversation…</p>}
      {turns.map(t => (
        <div key={t.id} className={t.role === 'assistant' ? 'text-accent-300' : 'text-twilight-200'}>
          <span className="font-mono text-xs mr-1">{t.role === 'assistant' ? 'A' : 'U'}:</span>
          {t.content}
        </div>
      ))}
    </div>
  );
};
