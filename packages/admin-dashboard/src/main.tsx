import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { loadRuntimeConfig } from './config/runtime';

const rootEl = document.getElementById('root');
if (rootEl) {rootEl.style.visibility = 'hidden';}

loadRuntimeConfig().finally(() => {
  if (rootEl) {rootEl.style.visibility = 'visible';}
  ReactDOM.createRoot(rootEl!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});