import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthGate } from './AuthGate';
import * as client from '../api/client';

describe('AuthGate', () => {
  it('renders children when the session check succeeds', async () => {
    vi.spyOn(client, 'checkSession').mockResolvedValue({ username: 'alice', role: 'user' });
    render(
      <MemoryRouter>
        <AuthGate>
          <p>protected content</p>
        </AuthGate>
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('protected content')).toBeInTheDocument());
  });

  it('renders the login page when the session check fails', async () => {
    vi.spyOn(client, 'checkSession').mockResolvedValue(null);
    render(
      <MemoryRouter>
        <AuthGate>
          <p>protected content</p>
        </AuthGate>
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('QA-Brain Console')).toBeInTheDocument());
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('renders the setup-password page for /setup even with no session', async () => {
    vi.spyOn(client, 'checkSession').mockResolvedValue(null);
    render(
      <MemoryRouter initialEntries={['/setup?username=bob&token=tok123']}>
        <AuthGate>
          <p>protected content</p>
        </AuthGate>
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Set your password')).toBeInTheDocument());
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });
});
