import React, { useState, useEffect, useRef } from 'react';
import { Heart, TrendingUp, Crown, RefreshCw } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Character, VADState } from '@rpg/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface EmotionalHistory {
  timestamp: string;
  vad_state: VADState;
  trigger?: string;
}

interface EmotionalStateVisualizerProps {
  className?: string;
}

export const EmotionalStateVisualizer: React.FC<EmotionalStateVisualizerProps> = ({ className }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [emotionalHistory, setEmotionalHistory] = useState<EmotionalHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chartRef = useRef(null);

  const fetchCharacters = async (): Promise<void> => {
    try {
      const response = await fetch('/api/memory/characters');
      if (response.ok) {
        const data = await response.json();
        setCharacters(data.characters || []);
        
        // Auto-select first character if none selected
        if (data.characters.length > 0 && !selectedCharacter) {
          setSelectedCharacter(data.characters[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch characters:', error);
    }
  };

  const fetchEmotionalHistory = async (characterId: string): Promise<void> => {
    if (!characterId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/memory/characters/${characterId}/emotions?limit=20`);
      if (response.ok) {
        const data = await response.json();
        setEmotionalHistory(data.emotional_history || []);
      }
    } catch (error) {
      console.error('Failed to fetch emotional history:', error);
      setEmotionalHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCharacters();
  }, []);

  useEffect(() => {
    if (selectedCharacter) {
      void fetchEmotionalHistory(selectedCharacter);
    }
  }, [selectedCharacter]);

  const getCurrentVAD = (): VADState => {
    const character = characters.find(c => c.id === selectedCharacter);
    return character?.emotional_state || { valence: 0, arousal: 0, dominance: 0 };
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        min: -1,
        max: 1,
        title: {
          display: true,
          text: 'VAD Values'
        },
        grid: {
          color: (context) => {
            if (context.tick.value === 0) return 'rgba(0, 0, 0, 0.3)';
            return 'rgba(0, 0, 0, 0.1)';
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Emotional State Evolution (VAD Model)'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          afterBody: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            const historyItem = emotionalHistory[index];
            return historyItem?.trigger ? [`Trigger: ${historyItem.trigger}`] : [];
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const chartData = {
    labels: emotionalHistory.map(item => 
      new Date(item.timestamp).toLocaleTimeString()
    ),
    datasets: [
      {
        label: 'Valence (Positive ↔ Negative)',
        data: emotionalHistory.map(item => item.vad_state.valence),
        borderColor: 'rgb(239, 68, 68)', // red-500
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.2
      },
      {
        label: 'Arousal (Calm ↔ Excited)',
        data: emotionalHistory.map(item => item.vad_state.arousal),
        borderColor: 'rgb(59, 130, 246)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.2
      },
      {
        label: 'Dominance (Submissive ↔ Dominant)',
        data: emotionalHistory.map(item => item.vad_state.dominance),
        borderColor: 'rgb(16, 185, 129)', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.2
      }
    ]
  };

  const formatVADValue = (value: number, dimension: 'valence' | 'arousal' | 'dominance'): string => {
    if (dimension === 'valence') {
      if (value > 0.3) return 'Positive';
      if (value < -0.3) return 'Negative';
      return 'Neutral';
    } else if (dimension === 'arousal') {
      if (value > 0.7) return 'Excited';
      if (value > 0.3) return 'Active';
      return 'Calm';
    } else { // dominance
      if (value > 0.7) return 'Dominant';
      if (value > 0.3) return 'Assertive';
      return 'Submissive';
    }
  };

  const currentVAD = getCurrentVAD();

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="panel-header">
        <div className="flex justify-between items-center">
          <h2 className="panel-title flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span>Emotional State Visualizer</span>
          </h2>
          <button
            onClick={() => {
              void fetchCharacters();
              if (selectedCharacter) {
                void fetchEmotionalHistory(selectedCharacter);
              }
            }}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
            title="Refresh emotional data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          VAD emotional model tracking over time
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Character Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Character
          </label>
          <select
            value={selectedCharacter}
            onChange={(e) => setSelectedCharacter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a character...</option>
            {characters.map(character => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCharacter && (
          <>
            {/* Current Emotional State */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">Valence</span>
                </div>
                <div className="text-lg font-bold text-red-600">
                  {currentVAD.valence.toFixed(2)}
                </div>
                <div className="text-xs text-red-600">
                  {formatVADValue(currentVAD.valence, 'valence')}
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">Arousal</span>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {currentVAD.arousal.toFixed(2)}
                </div>
                <div className="text-xs text-blue-600">
                  {formatVADValue(currentVAD.arousal, 'arousal')}
                </div>
              </div>

              <div className="bg-emerald-50 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Crown className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700">Dominance</span>
                </div>
                <div className="text-lg font-bold text-emerald-600">
                  {currentVAD.dominance.toFixed(2)}
                </div>
                <div className="text-xs text-emerald-600">
                  {formatVADValue(currentVAD.dominance, 'dominance')}
                </div>
              </div>
            </div>

            {/* Emotional History Chart */}
            <div className="h-64">
              {emotionalHistory.length > 0 ? (
                <Line ref={chartRef} options={chartOptions} data={chartData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Loading emotional history...</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No emotional history available</p>
                      <p className="text-sm mt-1">
                        Emotional changes will appear here as conversations progress
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* VAD Model Explanation */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                VAD Emotional Model
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Valence:</strong> Pleasure/displeasure (-1 to +1, negative to positive emotions)</div>
                <div><strong>Arousal:</strong> Activity level (0 to 1, calm to excited/energetic)</div>
                <div><strong>Dominance:</strong> Control/power (0 to 1, submissive to dominant/assertive)</div>
              </div>
            </div>
          </>
        )}

        {characters.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No characters detected yet</p>
            <p className="text-sm mt-2">
              Characters will appear here as they're mentioned in conversations
            </p>
          </div>
        )}
      </div>
    </div>
  );
};