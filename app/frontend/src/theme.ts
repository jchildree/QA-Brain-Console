// Full class strings, not interpolated color names -- Tailwind's build-time
// scanner only picks up literal class strings, so each badge variant is
// written out in full here rather than assembled from a bare color name.

export const recordTypeBadge: Record<string, string> = {
  SOP: 'bg-green-500/10 text-green-400 border-green-500/20',
  CAP: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Incident: 'bg-red-500/10 text-red-400 border-red-500/20',
  Change: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Audit: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Training: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

export const statusBadge: Record<string, string> = {
  Draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  'In Review': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Approved: 'bg-green-500/10 text-green-400 border-green-500/20',
  Obsolete: 'bg-slate-700/40 text-slate-500 border-slate-700',
};

export const DEFAULT_BADGE = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
