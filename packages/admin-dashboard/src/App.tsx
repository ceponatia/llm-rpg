import { useState, useEffect } from 'react';
import { logger } from '@rpg/utils';
import { ChatPanel } from './components/ChatPanel';
import { UnderTheHoodPanel } from './components/UnderTheHoodPanel';
import { MemoryInspectorPanel } from './components/MemoryInspectorPanel';
import { FeatureGate } from './components/FeatureGate';
import { PromptInspectorPanel } from './components/PromptInspectorPanel';
import { TokenCostTuner } from './components/TokenCostTuner';
import { WebSocketProvider } from './contexts/WebSocketContext';
import type { WeightedMemoryFusion, ChatMessage, MemoryOperation, CharacterProfile } from '@rpg/types';
import { CharacterSelector } from './components/CharacterSelector';

function App(): JSX.Element {
  const [fusionWeights, setFusionWeights] = useState<WeightedMemoryFusion>({
    w_L1: 0.4,
    w_L2: 0.4,
    w_L3: 0.2
  });
  
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);
  const [memoryOperations, setMemoryOperations] = useState<Array<MemoryOperation>>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [characters, setCharacters] = useState<Array<CharacterProfile>>([]);
  const [charactersLoading, setCharactersLoading] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterProfile | null>(null);

  // Generate session ID on mount
  useEffect(() => {
    setCurrentSessionId(crypto.randomUUID());
  }, []);

  // Fetch characters on load
  useEffect(() => {
    const fetchCharacters = async (): Promise<void> => {
      setCharactersLoading(true);
      try {
        const res = await fetch('/api/characters');
        if (!res.ok) {
          logger.warn('Failed to fetch characters');
          return;
        }
        const json: unknown = await res.json();
        let list: Array<CharacterProfile> = [];
        if (json !== null && typeof json === 'object' && Array.isArray((json as { characters?: unknown }).characters)) {
          const raw = (json as { characters: Array<unknown> }).characters;
            // Narrow each element minimally
          list = raw.filter((c): c is CharacterProfile =>
            c !== null && typeof c === 'object' && 'id' in c && typeof (c as { id?: unknown }).id === 'string' && 'name' in c && typeof (c as { name?: unknown }).name === 'string'
          );
        }
        setCharacters(list);
      } catch (e) {
        logger.error('Error fetching characters', e);
      } finally {
        setCharactersLoading(false);
      }
    };
    fetchCharacters().catch((err) => logger.error('fetchCharacters root error', err));
  }, []);

  const handleNewMessage = (message: ChatMessage): void => {
    setMessages(prev => [...prev, message]);
    // Add memory operations from message metadata (guard nullish & array type)
    const ops = message.metadata?.memory_operations;
    if (Array.isArray(ops) && ops.length > 0) {
      setMemoryOperations(prev => [...prev, ...ops]);
    }
  };

  const handleFusionWeightsChange = (newWeights: WeightedMemoryFusion): void => {
    setFusionWeights(newWeights);
  };

  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center py-4 space-y-4 md:space-y-0">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Cognitive Architecture Simulator
                </h1>
                <div className="text-sm text-gray-500">
                  Session: {currentSessionId !== '' ? currentSessionId.slice(0, 8) : 'unknown'}...
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <CharacterSelector
                  characters={characters}
                  selectedCharacter={selectedCharacter}
                  onSelect={setSelectedCharacter}
                  loading={charactersLoading}
                />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Token Cost Tuner */}
          <div className="mb-6">
            <TokenCostTuner
              fusionWeights={fusionWeights}
              onWeightsChange={handleFusionWeightsChange}
              sessionId={currentSessionId}
            />
          </div>

          {/* Main 4-Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[800px]">
            {/* Top Left: Chat Panel */}
            <div className="bg-white rounded-lg shadow">
              <ChatPanel
                sessionId={currentSessionId}
                onNewMessage={handleNewMessage}
                fusionWeights={fusionWeights}
                selectedCharacter={selectedCharacter}
              />
            </div>

            {/* Top Right: Under the Hood Panel */}
            <div className="bg-white rounded-lg shadow">
              <UnderTheHoodPanel operations={memoryOperations} />
            </div>

            {/* Bottom Left: Memory Inspector Panel (feature gated) */}
            <FeatureGate flag="memoryInspector" fallback={<div className="bg-white rounded-lg shadow p-4 text-sm text-gray-500">Memory Inspector disabled.</div>}>
              <div className="bg-white rounded-lg shadow">
                <MemoryInspectorPanel sessionId={currentSessionId} />
              </div>
            </FeatureGate>

            {/* Bottom Right: Prompt Inspector Panel */}
            <div className="bg-white rounded-lg shadow">
              <PromptInspectorPanel 
                messages={messages}
                fusionWeights={fusionWeights}
              />
            </div>
          </div>
        </main>
      </div>
    </WebSocketProvider>
  );
}

export default App;