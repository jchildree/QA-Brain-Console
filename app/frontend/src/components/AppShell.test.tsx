import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';
import { AuthContext } from '../context/AuthContext';

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
      ['Evidence Library', '/evidence'],
      ['Settings', '/settings'],
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

  it('does not show a Users nav link for a regular user', () => {
    render(
      <MemoryRouter>
        <AppShell>
          <p>child content</p>
        </AppShell>
      </MemoryRouter>
    );
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
  });

  it('shows a Users nav link for an admin', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ username: 'admin-user', role: 'admin', isAdmin: true, logout: vi.fn() }}>
          <AppShell>
            <p>child content</p>
          </AppShell>
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/admin/users');
  });
});
