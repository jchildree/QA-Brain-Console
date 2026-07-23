import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthGate } from './AuthGate';
import * as client from '../api/client';

describe('AuthGate', () => {
  it('renders children when the session check succeeds', async () => {
    vi.spyOn(client, 'checkSession').mockResolvedValue(true);
    render(
      <AuthGate>
        <p>protected content</p>
      </AuthGate>
    );
    await waitFor(() => expect(screen.getByText('protected content')).toBeInTheDocument());
  });

  it('renders the login page when the session check fails', async () => {
    vi.spyOn(client, 'checkSession').mockResolvedValue(false);
    render(
      <AuthGate>
        <p>protected content</p>
      </AuthGate>
    );
    await waitFor(() => expect(screen.getByText('QA-Brain Console')).toBeInTheDocument());
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });
});
