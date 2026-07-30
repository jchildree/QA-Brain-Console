import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { checkSession, logout as apiLogout } from '../api/client';
import { LoginPage } from '../pages/LoginPage';
import { AuthContext } from '../context/AuthContext';

export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'authed' | 'unauthed'>('checking');
  const [username, setUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSession()
      .then((name) => {
        setUsername(name);
        setStatus(name ? 'authed' : 'unauthed');
      })
      .catch(() => {
        setError('Could not reach the backend to check login status. Is it running, and does its FRONTEND_ORIGIN match this page\'s origin?');
        setStatus('unauthed');
      });
  }, []);

  const logout = () => {
    apiLogout().finally(() => {
      setUsername(null);
      setStatus('unauthed');
    });
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper)' }}>
        <p className="text-sm font-mono" style={{ color: 'var(--ink-dim)' }}>Loading…</p>
      </div>
    );
  }
  if (status === 'unauthed') {
    return (
      <LoginPage
        onSuccess={(name) => {
          setUsername(name);
          setStatus('authed');
        }}
        error={error}
      />
    );
  }
  return <AuthContext.Provider value={{ username, logout }}>{children}</AuthContext.Provider>;
}
