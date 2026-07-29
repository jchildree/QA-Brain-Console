import { useState } from 'react';
import { login } from '../api/client';

export function LoginPage({ onSuccess, error: initialError }: { onSuccess: () => void; error?: string | null }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const ok = await login(password);
      if (ok) {
        onSuccess();
      } else {
        setError('Incorrect password');
      }
    } catch {
      setError('Could not reach the backend. Is it running?');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--paper)' }}>
      <form
        className="w-full max-w-sm rounded-xl p-8 flex flex-col gap-5"
        style={{ border: '1px solid var(--rule)', background: 'var(--card)', boxShadow: 'var(--shadow)' }}
        onSubmit={handleSubmit}
      >
        <div>
          <h1 className="text-sm font-bold tracking-wide uppercase" style={{ color: 'var(--ink)' }}>QA-Brain Console</h1>
          <p className="text-xs font-mono" style={{ color: 'var(--ink-dim)' }}>Sign in to continue</p>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Password</span>
          <input
            aria-label="Password"
            type="password"
            className="text-sm px-3 py-2 rounded-lg focus:outline-none font-mono border"
            style={{ background: 'var(--paper-2)', borderColor: 'var(--rule)', color: 'var(--ink)' }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" disabled={submitting || !password} className="accession-btn">
          Log in
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
