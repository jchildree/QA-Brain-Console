import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusPill } from './StatusPill';

describe('StatusPill', () => {
  it('renders the status text', () => {
    render(<StatusPill status="Approved" />);
    expect(screen.getByTestId('status-pill')).toHaveTextContent('Approved');
  });

  it('applies a distinct color class per status', () => {
    render(<StatusPill status="Draft" />);
    const pill = screen.getByTestId('status-pill');
    expect(pill.className).toMatch(/text-slate-400/);
  });
});
