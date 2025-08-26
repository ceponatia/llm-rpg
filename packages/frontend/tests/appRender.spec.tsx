import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { App } from '../src/pages/App';
import { useSessionStore } from '../src/state/sessionStore';

describe('App conditional render', () => {
  it('shows landing when unauthenticated then dashboard after login', () => {
    render(<App />);
  expect(screen.getAllByText(/Story Engine/i).length).toBeGreaterThan(0);
    // Perform login via store
    useSessionStore.getState().login('user@example.com', 'pw');
    // Rerender to reflect state change
    render(<App />);
  expect(screen.getAllByText('Library').length).toBeGreaterThan(0);
  });
});
