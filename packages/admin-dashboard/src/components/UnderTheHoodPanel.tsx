import React, { useEffect, useState } from 'react';
import { Activity, Clock, Database, Brain } from 'lucide-react';
import type { MemoryOperation } from '@rpg/types';
import { useWebSocket } from '../contexts/WebSocketContext';

interface UnderTheHoodPanelProps {
  operations: Array<MemoryOperation>;
}

export const UnderTheHoodPanel: React.FC<UnderTheHoodPanelProps> = ({ operations }) => {
  const [allOperations, setAllOperations] = useState<Array<MemoryOperation>>(operations);
  const { lastMessage } = useWebSocket();

  // Listen for real-time memory operations from WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'memory_operation') {
      setAllOperations(prev => [...prev, lastMessage.data as MemoryOperation]);
    }
  }, [lastMessage]);

  // Sync with props
  useEffect(() => {
    setAllOperations(operations);
  }, [operations]);

  const getOperationIcon = (layer: string): JSX.Element => {
    switch (layer) {
      case 'L1':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'L2':
        return <Database className="w-4 h-4 text-green-500" />;
      case 'L3':
        return <Brain className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getOperationColor = (layer: string): string => {
    switch (layer) {
      case 'L1':
        return 'bg-blue-50 border-blue-200';
      case 'L2':
        return 'bg-green-50 border-green-200';
      case 'L3':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatOperation = (operation: MemoryOperation): string => {
    const { layer, operation: op, details } = operation;
    
    switch (op) {
      case 'addTurn':
        return `Added conversation turn to working memory`;
      case 'updateCharacterEmotion':
        return `Updated ${details?.character_id} emotional state`;
      case 'createFact':
        return `Created new fact: ${details?.fact_id}`;
      case 'createRelationship':
        return `Created relationship: ${details?.relationship_id}`;
      case 'addVectorFragment':
        return `Added ${details?.content_type} to semantic archive`;
      case 'storeTurn':
        return `Stored conversation turn in graph memory`;
      default:
        return `${op} operation in ${layer}`;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="panel-header">
        <h2 className="panel-title flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Under the Hood</span>
        </h2>
        <div className="text-sm text-gray-500 mt-1">
          Real-time memory operations and processing steps
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {allOperations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No memory operations yet</p>
            <p className="text-sm mt-2">
              Start a conversation to see the memory system in action
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {allOperations.slice().reverse().map((operation, index) => (
              <div
                key={operation.id || index}
                className={`p-3 rounded-lg border ${getOperationColor(operation.layer)} transition-all duration-200`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getOperationIcon(operation.layer)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          operation.layer === 'L1' ? 'bg-blue-100 text-blue-800' :
                          operation.layer === 'L2' ? 'bg-green-100 text-green-800' :
                          operation.layer === 'L3' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {operation.layer}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          operation.type === 'read' ? 'bg-blue-100 text-blue-700' :
                          operation.type === 'write' ? 'bg-green-100 text-green-700' :
                          operation.type === 'update' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {operation.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatOperation(operation)}
                      </p>
                      {operation.details && (
                        <div className="text-xs text-gray-600 mt-1 font-mono bg-gray-100 p-2 rounded">
                          {JSON.stringify(operation.details, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 ml-4 flex-shrink-0">
                    {formatTimestamp(operation.timestamp)}
                    {operation.duration_ms !== undefined && (
                      <div className="mt-1">
                        {operation.duration_ms}ms
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="border-t p-4 bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {allOperations.filter(op => op.layer === 'L1').length}
            </div>
            <div className="text-xs text-gray-600">L1 Operations</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">
              {allOperations.filter(op => op.layer === 'L2').length}
            </div>
            <div className="text-xs text-gray-600">L2 Operations</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-purple-600">
              {allOperations.filter(op => op.layer === 'L3').length}
            </div>
            <div className="text-xs text-gray-600">L3 Operations</div>
          </div>
        </div>
      </div>
    </div>
  );
};