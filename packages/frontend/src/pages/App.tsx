import { useSessionStore } from '../state/sessionStore';
import { Dashboard } from './Dashboard';
import { LandingPage } from './LandingPage';

export const App = () => {
  const { isAuthenticated } = useSessionStore();
  return isAuthenticated ? <Dashboard /> : <LandingPage />;
};
