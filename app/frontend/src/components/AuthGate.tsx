import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { checkSession, logout as apiLogout, type AuthedUser } from '../api/client';
import { LoginPage } from '../pages/LoginPage';
import { SetupPasswordPage } from '../pages/SetupPasswordPage';
import { AuthContext } from '../context/AuthContext';

export function AuthGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [status, setStatus] = useState<'checking' | 'authed' | 'unauthed'>('checking');
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSession()
      .then((found) => {
        setUser(found);
        setStatus(found ? 'authed' : 'unauthed');
      })
      .catch(() => {
        setError('Could not reach the backend to check login status. Is it running, and does its FRONTEND_ORIGIN match this page\'s origin?');
        setStatus('unauthed');
      });
  }, []);

  const logout = () => {
    apiLogout().finally(() => {
      setUser(null);
      setStatus('unauthed');
    });
  };

  // A new user following a setup link isn't logged in yet -- this route must be
  // reachable regardless of session status, so it's checked before any of the
  // authed/unauthed branching below.
  if (location.pathname === '/setup' && status !== 'authed') {
    return (
      <SetupPasswordPage
        onSuccess={(found) => {
          setUser(found);
          setStatus('authed');
        }}
      />
    );
  }

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
        onSuccess={(found) => {
          setUser(found);
          setStatus('authed');
        }}
        error={error}
      />
    );
  }
  return (
    <AuthContext.Provider
      value={{ username: user?.username ?? null, role: user?.role ?? null, isAdmin: user?.role === 'admin', logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
