import { useSessionStore } from '../state/sessionStore';
import { Dashboard } from './Dashboard';
import { LandingPage } from './LandingPage';
import type { FC } from 'react';

export const App: FC = () => {
  const { isAuthenticated } = useSessionStore();
  return isAuthenticated ? <Dashboard /> : <LandingPage />;
};
