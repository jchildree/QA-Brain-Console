import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { checkSession } from '../api/client';
import { LoginPage } from '../pages/LoginPage';

export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'authed' | 'unauthed'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSession()
      .then((ok) => setStatus(ok ? 'authed' : 'unauthed'))
      .catch(() => {
        setError('Could not reach the backend to check login status. Is it running, and does its FRONTEND_ORIGIN match this page\'s origin?');
        setStatus('unauthed');
      });
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-sm font-mono text-slate-500">Loading…</p>
      </div>
    );
  }
  if (status === 'unauthed') return <LoginPage onSuccess={() => setStatus('authed')} error={error} />;
  return <>{children}</>;
}
