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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <form
        className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-8 flex flex-col gap-5"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 font-bold text-xl">
            Q
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">QA-Brain Console</h1>
            <p className="text-xs text-slate-400 font-mono">Sign in to continue</p>
          </div>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-mono font-bold uppercase tracking-wide text-slate-400">Password</span>
          <input
            aria-label="Password"
            type="password"
            className="bg-slate-950 border border-slate-800 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-green-500 text-slate-200 font-mono"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={submitting || !password}
          className="rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-40 disabled:hover:bg-green-500/10 transition-colors px-4 py-2 text-sm font-bold"
        >
          Log in
        </button>
        {error && (
          <p role="alert" className="text-xs text-red-400 font-mono">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
