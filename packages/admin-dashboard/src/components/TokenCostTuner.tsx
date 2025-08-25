import React, { useState, useEffect } from 'react';
import { Sliders, DollarSign, Zap } from 'lucide-react';
import type { WeightedMemoryFusion, TokenCost } from '@rpg/types';

interface TokenCostTunerProps {
  fusionWeights: WeightedMemoryFusion;
  onWeightsChange: (weights: WeightedMemoryFusion) => void;
  sessionId: string;
}

export const TokenCostTuner: React.FC<TokenCostTunerProps> = ({
  fusionWeights,
  onWeightsChange,
  sessionId
}) => {
  const [localWeights, setLocalWeights] = useState(fusionWeights);
  const [tokenEstimate, setTokenEstimate] = useState<TokenCost | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  // Update local weights when props change
  useEffect(() => {
    setLocalWeights(fusionWeights);
  }, [fusionWeights]);

  // Estimate token cost when weights change
  useEffect(() => {
    const estimateTokens = async (): Promise<void> => {
      setIsEstimating(true);
      try {
        const response = await fetch('/api/config/estimate-tokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fusion_weights: localWeights,
            query: 'sample query',
            session_id: sessionId
          })
        });

        if (response.ok) {
          const estimate = await response.json();
          setTokenEstimate(estimate);
        }
      } catch (error) {
        console.error('Failed to estimate token cost:', error);
      } finally {
        setIsEstimating(false);
      }
    };

    void estimateTokens();
  }, [localWeights, sessionId]);

  const handleWeightChange = (layer: keyof WeightedMemoryFusion, value: number): void => {
    const newWeights = { ...localWeights, [layer]: value };
    
    // Auto-normalize weights to sum to 1.0
    const total = newWeights.w_L1 + newWeights.w_L2 + newWeights.w_L3;
    if (total > 0) {
      newWeights.w_L1 = newWeights.w_L1 / total;
      newWeights.w_L2 = newWeights.w_L2 / total;
      newWeights.w_L3 = newWeights.w_L3 / total;
    }
    
    setLocalWeights(newWeights);
    onWeightsChange(newWeights);
  };

  const handlePreset = (preset: 'balanced' | 'recent' | 'factual' | 'semantic'): void => {
    let newWeights: WeightedMemoryFusion;
    
    switch (preset) {
      case 'balanced':
        newWeights = { w_L1: 0.33, w_L2: 0.34, w_L3: 0.33 };
        break;
      case 'recent':
        newWeights = { w_L1: 0.6, w_L2: 0.3, w_L3: 0.1 };
        break;
      case 'factual':
        newWeights = { w_L1: 0.2, w_L2: 0.6, w_L3: 0.2 };
        break;
      case 'semantic':
        newWeights = { w_L1: 0.1, w_L2: 0.3, w_L3: 0.6 };
        break;
    }
    
    setLocalWeights(newWeights);
    onWeightsChange(newWeights);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Token Cost & Fusion Tuner
          </h2>
        </div>
        
        {tokenEstimate && (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">{tokenEstimate.total_tokens}</span>
              <span className="text-gray-500">tokens</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="font-medium">${tokenEstimate.estimated_cost.toFixed(4)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Presets */}
      <div className="mb-6">
        <div className="text-sm font-medium text-gray-700 mb-2">Quick Presets:</div>
        <div className="flex space-x-2">
          {[
            { key: 'balanced', label: 'Balanced', desc: 'Equal weight to all layers' },
            { key: 'recent', label: 'Recent Focus', desc: 'Emphasize working memory' },
            { key: 'factual', label: 'Factual', desc: 'Emphasize graph knowledge' },
            { key: 'semantic', label: 'Semantic', desc: 'Emphasize vector archive' }
          ].map(preset => (
            <button
              key={preset.key}
              onClick={() => handlePreset(preset.key as 'balanced' | 'recent' | 'factual' | 'semantic')}
              className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title={preset.desc}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-6">
        {/* L1 - Working Memory */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-blue-700">
              L1 - Working Memory
            </label>
            <span className="text-sm text-gray-600">
              {(localWeights.w_L1 * 100).toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={localWeights.w_L1}
            onChange={(e) => handleWeightChange('w_L1', parseFloat(e.target.value))}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider-blue"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Recent conversations</span>
            <span>
              {tokenEstimate && `${tokenEstimate.l1_tokens} tokens`}
            </span>
          </div>
        </div>

        {/* L2 - Graph Memory */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-green-700">
              L2 - Episodic Graph
            </label>
            <span className="text-sm text-gray-600">
              {(localWeights.w_L2 * 100).toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={localWeights.w_L2}
            onChange={(e) => handleWeightChange('w_L2', parseFloat(e.target.value))}
            className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer slider-green"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Characters, facts, relationships</span>
            <span>
              {tokenEstimate && `${tokenEstimate.l2_tokens} tokens`}
            </span>
          </div>
        </div>

        {/* L3 - Vector Memory */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-purple-700">
              L3 - Semantic Archive
            </label>
            <span className="text-sm text-gray-600">
              {(localWeights.w_L3 * 100).toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={localWeights.w_L3}
            onChange={(e) => handleWeightChange('w_L3', parseFloat(e.target.value))}
            className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer slider-purple"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Summaries and insights</span>
            <span>
              {tokenEstimate && `${tokenEstimate.l3_tokens} tokens`}
            </span>
          </div>
        </div>
      </div>

      {/* Weight Sum Indicator */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Total Weight:</span>
          <span className={`font-medium ${
            Math.abs((localWeights.w_L1 + localWeights.w_L2 + localWeights.w_L3) - 1.0) < 0.01
              ? 'text-green-600'
              : 'text-red-600'
          }`}>
            {(localWeights.w_L1 + localWeights.w_L2 + localWeights.w_L3).toFixed(3)}
          </span>
        </div>
        {isEstimating && (
          <div className="text-xs text-gray-500 mt-1">
            Estimating token cost...
          </div>
        )}
      </div>
    </div>
  );
};