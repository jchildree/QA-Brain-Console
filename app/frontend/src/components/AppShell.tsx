import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

const NAV_LINKS: { label: string; to: string }[] = [
  { label: 'Overview', to: '/' },
  { label: 'SOP', to: '/sop' },
  { label: 'CAP', to: '/cap' },
  { label: 'Incident', to: '/incident' },
  { label: 'Change', to: '/change' },
  { label: 'Audit', to: '/audit' },
  { label: 'Training', to: '/training' },
  { label: 'Evidence Library', to: '/evidence' },
  { label: 'Settings', to: '/settings' },
];

const TODAY = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] selection:bg-[var(--gold)]/30 selection:text-[var(--ink)]">
      <div className="max-w-[1640px] mx-auto px-6 pt-6 pb-11">
        <div className="masthead">
          <div>
            <h1>QA-Brain Console</h1>
            <div className="sub">Register of Controlled Records &middot; {TODAY}</div>
          </div>
          <div className="masthead-right">
            <b>Joseph Childree</b>
            QA &middot; Quality System Owner
          </div>
        </div>

        <nav className="tabs">
          {NAV_LINKS.map((link) => (
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
