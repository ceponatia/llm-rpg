import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { loadRuntimeConfig } from './config/runtime';

const rootEl = document.getElementById('root');
if (rootEl !== null) { rootEl.style.visibility = 'hidden'; }

void loadRuntimeConfig().finally(() => {
  if (rootEl === null) { return; }
  rootEl.style.visibility = 'visible';
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});