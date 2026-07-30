import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SetupPasswordPage } from './SetupPasswordPage';
import * as client from '../api/client';

function renderAt(path: string, onSuccess = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SetupPasswordPage onSuccess={onSuccess} />
    </MemoryRouter>
  );
}

describe('SetupPasswordPage', () => {
  it('calls onSuccess with the logged-in user after a successful setup', async () => {
    vi.spyOn(client, 'setupPassword').mockResolvedValue({ username: 'bob', role: 'user' });
    const onSuccess = vi.fn();
    renderAt('/setup?username=bob&token=tok123', onSuccess);

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'newpass1' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'newpass1' } });
    fireEvent.click(screen.getByText('Set Password'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ username: 'bob', role: 'user' }));
    expect(client.setupPassword).toHaveBeenCalledWith('bob', 'tok123', 'newpass1');
  });

  it('shows an error when the passwords do not match, without calling the API', async () => {
    renderAt('/setup?username=bob&token=tok123');
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'newpass1' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'different' } });
    fireEvent.click(screen.getByText('Set Password'));

    expect(await screen.findByRole('alert')).toHaveTextContent(/do not match/i);
  });

  it('shows an error for an invalid or expired token', async () => {
    vi.spyOn(client, 'setupPassword').mockResolvedValue(null);
    renderAt('/setup?username=bob&token=badtoken');

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'newpass1' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'newpass1' } });
    fireEvent.click(screen.getByText('Set Password'));

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid or has expired/i);
  });

  it('shows a message when the link is missing username or token', () => {
    renderAt('/setup');
    expect(screen.getByRole('alert')).toHaveTextContent(/missing its username or token/i);
  });
});
