import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from './LoginPage';
import * as client from '../api/client';

describe('LoginPage', () => {
  it('calls onSuccess after a successful login', async () => {
    vi.spyOn(client, 'login').mockResolvedValue(true);
    const onSuccess = vi.fn();
    render(<LoginPage onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByText('Log in'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('shows an error and does not call onSuccess on a failed login', async () => {
    vi.spyOn(client, 'login').mockResolvedValue(false);
    const onSuccess = vi.fn();
    render(<LoginPage onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('Log in'));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/incorrect/i));
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
