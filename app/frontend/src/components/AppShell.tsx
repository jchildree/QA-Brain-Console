import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BASE_NAV_LINKS: { label: string; to: string }[] = [
  { label: 'Overview', to: '/' },
  { label: 'SOP', to: '/sop' },
  { label: 'CAP', to: '/cap' },
  { label: 'Incident', to: '/incident' },
  { label: 'Change', to: '/change' },
  { label: 'Audit', to: '/audit' },
  { label: 'Training', to: '/training' },
  { label: 'Notes', to: '/notes' },
  { label: 'Evidence Library', to: '/evidence' },
  { label: 'Trash', to: '/trash' },
  { label: 'Settings', to: '/settings' },
];

const TODAY = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

export function AppShell({ children }: { children: ReactNode }) {
  const { username, isAdmin, logout } = useAuth();
  const navLinks = isAdmin ? [...BASE_NAV_LINKS, { label: 'Users', to: '/admin/users' }] : BASE_NAV_LINKS;
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] selection:bg-[var(--gold)]/30 selection:text-[var(--ink)]">
      <div className="max-w-[1640px] mx-auto px-6 pt-6 pb-11">
        <div className="masthead">
          <div>
            <h1>QA-Brain Console</h1>
            <div className="sub">Register of Controlled Records &middot; {TODAY}</div>
          </div>
          <div className="masthead-right">
            <b>{username}</b>
            <button type="button" onClick={logout} className="masthead-logout">
              Log out
            </button>
          </div>
        </div>

        <nav className="tabs">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `tab${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <main>{children}</main>
      </div>
    </div>
  );
}
