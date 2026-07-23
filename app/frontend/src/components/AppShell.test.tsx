import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('renders a nav link for every console section', () => {
    render(
      <MemoryRouter>
        <AppShell>
          <p>child content</p>
        </AppShell>
      </MemoryRouter>
    );
    const expected: [string, string][] = [
      ['Overview', '/'],
      ['SOP', '/sop'],
      ['CAP', '/cap'],
      ['Incident', '/incident'],
      ['Change', '/change'],
      ['Audit', '/audit'],
      ['Training', '/training'],
      ['Settings', '/settings'],
      ['Evidence Library', '/evidence'],
      ['Search', '/search'],
    ];
    expected.forEach(([text, href]) => {
      expect(screen.getByRole('link', { name: text })).toHaveAttribute('href', href);
    });
  });

  it('renders its children', () => {
    render(
      <MemoryRouter>
        <AppShell>
          <p>child content</p>
        </AppShell>
      </MemoryRouter>
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });
});
