import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AffectionMeter } from '../src/components/chat/AffectionMeter';

describe('AffectionMeter', () => {
  it('shows value and optional intent', () => {
    render(<AffectionMeter value={42} lastIntent="excited" />);
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText(/Last intent/i)).toBeTruthy();
  });
});
