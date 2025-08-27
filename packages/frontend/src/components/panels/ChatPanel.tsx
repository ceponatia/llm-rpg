import React from 'react';
import { useChatStore } from '../../state/chatStore';
import { isEnabled } from '../../utils/flags';
import { MessageList } from '../chat/MessageList';
import { AffectionMeter } from '../chat/AffectionMeter';
import { ChatInput } from '../chat/ChatInput';
import { Panel } from '../ui/Panel';

export const ChatPanel: React.FC = () => {
  if (!isEnabled('FRONTEND_CHAT_ENABLED')) return null;
  const { turns, send, sending, error, affection, lastIntent } = useChatStore();
  return (
  <Panel>
      <h2 className="text-lg font-semibold tracking-tight">Chat</h2>
  <MessageList turns={turns} />
      <AffectionMeter value={affection} lastIntent={lastIntent} />
      <ChatInput onSend={(text) => { void send(text); }} sending={sending} />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {sending && <p className="text-xs text-twilight-500">Sending…</p>}
      <p className="text-[10px] uppercase tracking-wide text-twilight-500">Feature Flag: FRONTEND_CHAT_ENABLED</p>
    </Panel>
  );
};
