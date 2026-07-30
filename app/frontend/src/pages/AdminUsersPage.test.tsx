import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminUsersPage } from './AdminUsersPage';
import * as client from '../api/client';
import { AuthContext } from '../context/AuthContext';

function renderAsAdmin(isAdmin = true) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ username: 'admin-user', role: isAdmin ? 'admin' : 'user', isAdmin, logout: vi.fn() }}>
        <AdminUsersPage />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.spyOn(client.adminApi, 'listUsers').mockResolvedValue([
    { username: 'admin-user', role: 'admin', active: true, pending: false },
    { username: 'newbie', role: 'user', active: true, pending: true },
  ]);
});

describe('AdminUsersPage', () => {
  it('redirects a non-admin away', () => {
    renderAsAdmin(false);
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('lists users with role, status, and pending badge', async () => {
    renderAsAdmin();
    expect(await screen.findByText('admin-user')).toBeInTheDocument();
    expect(screen.getByText('newbie')).toBeInTheDocument();
    expect(screen.getByText('Pending setup')).toBeInTheDocument();
  });

  it('creates a user and shows the generated setup link', async () => {
    vi.spyOn(client.adminApi, 'createUser').mockResolvedValue({ username: 'carol', role: 'user', setupToken: 'tok123' });
    renderAsAdmin();
    await screen.findByText('admin-user');

    fireEvent.change(screen.getByLabelText('New Username'), { target: { value: 'carol' } });
    fireEvent.click(screen.getByText('Add User'));

    await waitFor(() => expect(client.adminApi.createUser).toHaveBeenCalledWith('carol', 'user'));
    expect(await screen.findByText(/tok123/)).toBeInTheDocument();
  });

  it('toggles active status', async () => {
    vi.spyOn(client.adminApi, 'updateUser').mockResolvedValue(undefined);
    renderAsAdmin();
    await screen.findByText('admin-user');

    fireEvent.click(screen.getAllByText('Deactivate')[0]);

    await waitFor(() => expect(client.adminApi.updateUser).toHaveBeenCalledWith('admin-user', { active: false }));
  });

  it('resends a setup link for a pending user', async () => {
    vi.spyOn(client.adminApi, 'resendSetup').mockResolvedValue({ setupToken: 'newtok' });
    renderAsAdmin();
    await screen.findByText('newbie');

    fireEvent.click(screen.getByText('Resend setup link'));

    await waitFor(() => expect(client.adminApi.resendSetup).toHaveBeenCalledWith('newbie'));
    expect(await screen.findByText(/newtok/)).toBeInTheDocument();
  });
});
