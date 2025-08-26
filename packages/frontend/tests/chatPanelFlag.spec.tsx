import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

describe('ChatPanel feature flag', () => {
  beforeEach(() => {
    // reset environment flag for each test
    delete process.env.VITE_FRONTEND_CHAT_ENABLED;
  });

  it('does not render when flag disabled', async () => {
    await (await import('vitest')).vi.resetModules();
    const { ChatPanel } = await import('../src/components/panels/ChatPanel');
    render(<ChatPanel />);
    expect(screen.queryByText(/Chat/i)).toBeNull();
  });

  it('renders when flag enabled', async () => {
    process.env.VITE_FRONTEND_CHAT_ENABLED = 'true';
    await (await import('vitest')).vi.resetModules();
    const { ChatPanel } = await import('../src/components/panels/ChatPanel');
    render(<ChatPanel />);
    expect(screen.getByText('Chat')).not.toBeNull();
  });
});
