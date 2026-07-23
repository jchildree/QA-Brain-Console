import { statusBadge, DEFAULT_BADGE } from '../theme';

export function StatusPill({ status }: { status: string }) {
  const classes = statusBadge[status] ?? DEFAULT_BADGE;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-mono font-semibold ${classes}`}
      data-testid="status-pill"
    >
      {status}
    </span>
  );
}
