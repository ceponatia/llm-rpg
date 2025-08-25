import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { ChatMessage, WeightedMemoryFusion, ChatRequest, ChatResponse, CharacterProfile } from '@rpg/types';

interface ChatPanelProps {
  sessionId: string;
  onNewMessage: (message: ChatMessage) => void;
  fusionWeights: WeightedMemoryFusion;
  selectedCharacter?: CharacterProfile | null;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  sessionId,
  onNewMessage,
  fusionWeights,
  selectedCharacter
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (): Promise<void> => {
    if (!inputValue.trim() || isLoading) return;

    const content = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    onNewMessage(userMessage);

    try {
      const baseSessionId = sessionId;
      const effectiveSessionId = selectedCharacter ? `${baseSessionId}:${selectedCharacter.id}` : baseSessionId;
      const req: ChatRequest & { character_id?: string; prompt_template?: string; template_vars?: { char?: string } } = {
        message: content,
        session_id: effectiveSessionId,
        fusion_weights: fusionWeights,
        ...(selectedCharacter ? {
          character_id: selectedCharacter.id,
          prompt_template: 'roleplay',
          template_vars: { char: selectedCharacter.name }
        } : {})
      };

      // Send message to backend
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const chatResponse: ChatResponse = await response.json();

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: chatResponse.id,
        role: 'assistant',
        content: chatResponse.content,
        timestamp: chatResponse.timestamp,
        metadata: chatResponse.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);
      onNewMessage(assistantMessage);

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Error processing your message.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
      onNewMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <h2 className="panel-title">Chat</h2>
        <div className="text-sm text-gray-500 mt-1">
          Interactive conversation with the cognitive agent
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>Start a conversation with the cognitive architecture simulator!</p>
            <p className="text-sm mt-2">
              Try asking about characters, events, or any topic to see memory in action.
            </p>
          </div>
        )}
        
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const metaName = message.metadata && 'character_name' in message.metadata ? (message.metadata as { character_name?: string }).character_name : undefined;
          const label = isUser ? 'You' : metaName || selectedCharacter?.name || 'Assistant';
          return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-2 ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900 border'}`}>
                {!isUser && <div className="text-xs font-semibold mb-1 text-gray-600">{label}</div>}
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
                <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                  {formatTimestamp(message.timestamp)}
                  {message.metadata?.tokens && (
                    <span className="ml-2">
                      • {message.metadata.tokens.total_tokens} tokens
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 border rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder:text-gray-400 caret-white bg-black"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};