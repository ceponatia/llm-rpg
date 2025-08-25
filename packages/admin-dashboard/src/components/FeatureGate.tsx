import type { ReactNode } from 'react';
import { getRuntimeConfig } from '../config/runtime';

interface FeatureGateProps {
  flag: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function FeatureGate({ flag, fallback = null, children }: FeatureGateProps): JSX.Element {
  const cfg = getRuntimeConfig();
  const features = cfg.features as Record<string, unknown> | undefined;
  const isEnabled = features !== undefined && Object.prototype.hasOwnProperty.call(features, flag) && Boolean(features[flag]);
  if (isEnabled) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}
