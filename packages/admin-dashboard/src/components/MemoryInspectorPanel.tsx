import React, { useState, useEffect, useCallback } from 'react';
import { Database, Clock, Brain, RefreshCw, Users, FileText, GitBranch } from 'lucide-react';

interface MemoryInspectorPanelProps {
  sessionId: string;
}

interface MemoryState {
  l1_working_memory: {
    total_sessions: number;
    active_sessions: Array<{
      session_id: string;
      turn_count: number;
      total_tokens: number;
      recent_activity: string;
    }>;
  };
  l2_graph_memory: {
    characters: number;
    facts: number;
    relationships: number;
    conversation_turns: number;
  };
  l3_vector_memory: {
    total_fragments: number;
    faiss_index_size: number;
    content_type_distribution: {
      summary: number;
      insight: number;
      event: number;
    };
    importance_statistics: {
      min: number;
      max: number;
      avg: number;
    };
  };
}

export const MemoryInspectorPanel: React.FC<MemoryInspectorPanelProps> = ({ sessionId }) => {
  const [memoryState, setMemoryState] = useState<MemoryState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'L1' | 'L2' | 'L3'>('L1');

  // Narrow raw API response into strongly typed MemoryState
  const isMemoryState = (value: unknown): value is MemoryState => {
    if (value === null || typeof value !== 'object') { return false; }
    const v = value as Record<string, unknown>;
    return (
      typeof v.l1_working_memory === 'object' && v.l1_working_memory !== null &&
      typeof v.l2_graph_memory === 'object' && v.l2_graph_memory !== null &&
      typeof v.l3_vector_memory === 'object' && v.l3_vector_memory !== null
    );
  };

  const fetchMemoryState = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/memory/inspect');
      if (!response.ok) {
        console.error('Failed to fetch memory state');
        setMemoryState(null);
        return;
      }
      const raw: unknown = await response.json();
      if (isMemoryState(raw)) {
        setMemoryState(raw);
      } else {
        console.error('Invalid memory state shape');
        setMemoryState(null);
      }
    } catch (error) {
      console.error('Error fetching memory state:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // endpoint currently global; if session-specific later add [sessionId]

  useEffect(() => {
    void fetchMemoryState();
    const interval = setInterval(() => { void fetchMemoryState(); }, 5000);
    return (): void => clearInterval(interval);
  }, [fetchMemoryState, sessionId]);

  const renderL1Inspector = (): JSX.Element | null => {
  const l1 = memoryState?.l1_working_memory;
  if (l1 == null) { return null; }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{l1.total_sessions}</div>
            <div className="text-sm text-blue-700">Active Sessions</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {l1.active_sessions.reduce((sum, s) => sum + s.turn_count, 0)}
            </div>
            <div className="text-sm text-blue-700">Total Turns</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Active Sessions</h4>
          {l1.active_sessions.length === 0 ? (
            <div className="text-gray-500 text-sm">No active sessions</div>
          ) : (
            l1.active_sessions.map((session) => (
              <div
                key={session.session_id}
                className={`p-3 rounded-lg border ${
                  session.session_id === sessionId
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-mono text-sm">
                      {session.session_id.slice(0, 8)}...
                      {session.session_id === sessionId && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {session.turn_count} turns • {session.total_tokens} tokens
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {session.recent_activity !== '' ? new Date(session.recent_activity).toLocaleTimeString() : ''}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderL2Inspector = (): JSX.Element | null => {
  const l2 = memoryState?.l2_graph_memory;
  if (l2 == null) { return null; }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{l2.characters}</div>
                <div className="text-sm text-green-700">Characters</div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{l2.facts}</div>
                <div className="text-sm text-green-700">Facts</div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{l2.relationships}</div>
                <div className="text-sm text-green-700">Relationships</div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{l2.conversation_turns}</div>
                <div className="text-sm text-green-700">Stored Turns</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderL3Inspector = (): JSX.Element | null => {
  const l3 = memoryState?.l3_vector_memory;
  if (l3 == null) { return null; }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{l3.total_fragments}</div>
            <div className="text-sm text-purple-700">Vector Fragments</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{l3.faiss_index_size}</div>
            <div className="text-sm text-purple-700">FAISS Index Size</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Content Distribution</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Summaries</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-400 h-2 rounded-full"
                      style={{
                        width: `${(l3.content_type_distribution.summary / l3.total_fragments) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">{l3.content_type_distribution.summary}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Insights</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{
                        width: `${(l3.content_type_distribution.insight / l3.total_fragments) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">{l3.content_type_distribution.insight}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Events</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${(l3.content_type_distribution.event / l3.total_fragments) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">{l3.content_type_distribution.event}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Importance Statistics</h4>
            <div className="bg-purple-50 p-3 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Min:</span>
                <span className="font-medium">{l3.importance_statistics.min.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Average:</span>
                <span className="font-medium">{l3.importance_statistics.avg.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Max:</span>
                <span className="font-medium">{l3.importance_statistics.max.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <div className="flex justify-between items-center">
          <h2 className="panel-title flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Memory Inspector</span>
          </h2>
          <button
            onClick={fetchMemoryState}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
            title="Refresh memory state"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Live view of memory layers and content
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 px-4">
        <div className="flex space-x-8">
          {[
            { key: 'L1', label: 'Working Memory', icon: Clock, color: 'blue' },
            { key: 'L2', label: 'Graph Memory', icon: Database, color: 'green' },
            { key: 'L3', label: 'Vector Memory', icon: Brain, color: 'purple' }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'L1' | 'L2' | 'L3')}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? `border-${tab.color}-500 text-${tab.color}-600`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2 text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading memory state...</span>
            </div>
          </div>
  ) : (memoryState !== null) ? (
          <div>
            {activeTab === 'L1' && renderL1Inspector()}
            {activeTab === 'L2' && renderL2Inspector()}
            {activeTab === 'L3' && renderL3Inspector()}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Failed to load memory state</p>
            <button
              onClick={fetchMemoryState}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};