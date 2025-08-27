import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MessageList } from '../src/components/chat/MessageList';

describe('MessageList', () => {
  it('renders empty state', () => {
    render(<MessageList turns={[]} />);
    expect(screen.getByText(/Start the conversation/i)).toBeTruthy();
  });
  it('renders turns', () => {
    render(<MessageList turns={[{ id: '1', role: 'user', content: 'Hi', timestamp: 't' }]} />);
    expect(screen.getByText('Hi')).toBeTruthy();
  });
});
