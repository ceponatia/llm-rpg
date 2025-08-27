import React from 'react';
import { cn } from '../../utils/cn';

export const Panel: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div className={cn('rounded-lg border border-twilight-700 bg-twilight-900/60 p-4 space-y-3', className)} {...rest} />
);
