import React from 'react';
import { cn } from '../../utils/cn';

interface ProgressProps { value: number; className?: string }
export const Progress: React.FC<ProgressProps> = ({ value, className }) => (
  <div className={cn('w-full h-2 bg-twilight-800 rounded overflow-hidden', className)}>
    <div className="h-full bg-accent-600 transition-all" style={{ width: `${Math.min(Math.max(value,0),100)}%` }} />
  </div>
);
