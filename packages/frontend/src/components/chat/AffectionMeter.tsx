import React from 'react';
import { Progress } from '../ui/Progress';

interface AffectionMeterProps { value: number; lastIntent?: string | null }

export const AffectionMeter: React.FC<AffectionMeterProps> = ({ value, lastIntent }) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-twilight-400">
        <span>Affection</span>
        <span className="font-mono">{value}</span>
      </div>
  <Progress value={value} />
      {lastIntent && <p className="text-[10px] text-twilight-500">Last intent: <span className="text-twilight-300">{lastIntent}</span></p>}
    </div>
  );
};
