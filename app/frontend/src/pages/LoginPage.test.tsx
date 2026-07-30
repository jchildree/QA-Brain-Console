import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from './LoginPage';
import * as client from '../api/client';

describe('LoginPage', () => {
  it('calls onSuccess with the username after a successful login', async () => {
    vi.spyOn(client, 'login').mockResolvedValue('alice');
    const onSuccess = vi.fn();
    render(<LoginPage onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByText('Log in'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('alice'));
  });

  it('shows an error and does not call onSuccess on a failed login', async () => {
    vi.spyOn(client, 'login').mockResolvedValue(null);
    const onSuccess = vi.fn();
    render(<LoginPage onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('Log in'));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/incorrect/i));
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
