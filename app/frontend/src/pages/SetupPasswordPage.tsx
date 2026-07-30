import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { setupPassword, type AuthedUser } from '../api/client';

export function SetupPasswordPage({ onSuccess }: { onSuccess: (user: AuthedUser) => void }) {
  const [params] = useSearchParams();
  const username = params.get('username') ?? '';
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const user = await setupPassword(username, token, password);
      if (user) {
        onSuccess(user);
      } else {
        setError('This setup link is invalid or has expired. Ask an admin to resend it.');
      }
    } catch {
      setError('Could not reach the backend. Is it running?');
    } finally {
      setSubmitting(false);
    }
  };

  if (!username || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--paper)' }}>
        <p role="alert" className="text-sm font-mono" style={{ color: 'var(--red)' }}>
          This setup link is missing its username or token.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--paper)' }}>
      <form
        className="w-full max-w-sm rounded-xl p-8 flex flex-col gap-5"
        style={{ border: '1px solid var(--rule)', background: 'var(--card)', boxShadow: 'var(--shadow)' }}
        onSubmit={handleSubmit}
      >
        <div>
          <h1 className="text-sm font-bold tracking-wide uppercase" style={{ color: 'var(--ink)' }}>Set your password</h1>
          <p className="text-xs font-mono" style={{ color: 'var(--ink-dim)' }}>Welcome, {username}</p>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Password</span>
          <input
            aria-label="Password"
            type="password"
            autoComplete="new-password"
            className="text-sm px-3 py-2 rounded-lg focus:outline-none font-mono border"
            style={{ background: 'var(--paper-2)', borderColor: 'var(--rule)', color: 'var(--ink)' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Confirm Password</span>
          <input
            aria-label="Confirm Password"
            type="password"
            autoComplete="new-password"
            className="text-sm px-3 py-2 rounded-lg focus:outline-none font-mono border"
            style={{ background: 'var(--paper-2)', borderColor: 'var(--rule)', color: 'var(--ink)' }}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        <button type="submit" disabled={submitting || !password || !confirm} className="accession-btn">
          Set Password
        </button>
        {error && (
          <p role="alert" className="text-xs font-mono" style={{ color: 'var(--red)' }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
