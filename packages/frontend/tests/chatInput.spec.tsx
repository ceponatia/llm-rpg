import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ChatInput } from '../src/components/chat/ChatInput';

describe('ChatInput', () => {
  it('calls onSend with entered text', async () => {
    const handler = vi.fn();
    render(<ChatInput onSend={handler} sending={false} />);
    const input = screen.getByPlaceholderText(/Type a message/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(input.closest('form')!);
    expect(handler).toHaveBeenCalledWith('Hello');
  });
});
