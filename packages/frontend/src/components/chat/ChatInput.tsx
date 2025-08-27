import React from 'react';

interface ChatInputProps { onSend: (text: string) => Promise<void> | void; sending: boolean }

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, sending }) => {
  const [text, setText] = React.useState('');
  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    void Promise.resolve(onSend(value)).finally(() => setText(''));
  };
  return (
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
  );
};
