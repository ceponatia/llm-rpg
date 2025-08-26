import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './pages/App';

const rootElement = document.getElementById('root');
if (rootElement === null) {
	throw new Error('Root element with id "root" not found');
}
createRoot(rootElement).render(<App />);
