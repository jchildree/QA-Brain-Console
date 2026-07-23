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
  { label: 'Settings', to: '/settings' },
  { label: 'Evidence Library', to: '/evidence' },
  { label: 'Search', to: '/search' },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-green-500/30 selection:text-green-300">
      <header className="sticky top-0 z-50 border-b border-slate-900 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 font-bold text-xl">
            Q
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">QA-Brain Console</h1>
            <p className="text-xs text-slate-400 font-mono">6-type vertical slice</p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-1 text-xs font-mono">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  isActive
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'text-slate-400 border border-transparent hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
