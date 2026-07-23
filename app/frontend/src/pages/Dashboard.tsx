import { useEffect, useState } from 'react';
import { listSops, type SopSummary } from '../api/client';
import { StatusPill } from '../components/StatusPill';

export function isOverdue(sop: SopSummary): boolean {
  return sop.status === 'Approved' && new Date(sop.review_date) < new Date();
}

function SopTable({ sops }: { sops: SopSummary[] }) {
  if (sops.length === 0) {
    return <p className="text-sm text-slate-500 font-mono px-1 py-3">No records.</p>;
  }
  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900 text-slate-400 text-xs font-mono uppercase tracking-wide">
            <th className="text-left font-semibold px-4 py-2.5">ID</th>
            <th className="text-left font-semibold px-4 py-2.5">Version</th>
            <th className="text-left font-semibold px-4 py-2.5">Status</th>
            <th className="text-left font-semibold px-4 py-2.5">Department</th>
            <th className="text-left font-semibold px-4 py-2.5">Review Date</th>
            <th className="text-left font-semibold px-4 py-2.5">Owner</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {sops.map((sop) => (
            <tr key={sop.filename} className="hover:bg-slate-900/60 transition-colors">
              <td className="px-4 py-2.5 font-mono text-slate-200">{sop.id}</td>
              <td className="px-4 py-2.5 text-slate-300">{sop.version}</td>
              <td className="px-4 py-2.5">
                <StatusPill status={sop.status} />
              </td>
              <td className="px-4 py-2.5 text-slate-300">{sop.department}</td>
              <td className="px-4 py-2.5 text-slate-300">{sop.review_date}</td>
              <td className="px-4 py-2.5 text-slate-300">{sop.owner}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Dashboard() {
  const [sops, setSops] = useState<SopSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSops()
      .then(setSops)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <p role="alert">{error}</p>;

  const controlled = sops.filter((s) => s.status !== 'Obsolete');
  const overdue = sops.filter(isOverdue);
  const inDraftOrReview = sops.filter((s) => s.status === 'Draft' || s.status === 'In Review');
  const obsolete = sops.filter((s) => s.status === 'Obsolete');

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-xs font-mono font-bold uppercase tracking-wide text-slate-400 mb-3">
          All Controlled SOPs ({controlled.length})
        </h2>
        <SopTable sops={controlled} />
      </section>
      <section>
        <h2 className="text-xs font-mono font-bold uppercase tracking-wide text-red-400 mb-3">
          Overdue for Review ({overdue.length})
        </h2>
        <SopTable sops={overdue} />
      </section>
      <section>
        <h2 className="text-xs font-mono font-bold uppercase tracking-wide text-amber-400 mb-3">
          In Draft / Review ({inDraftOrReview.length})
        </h2>
        <SopTable sops={inDraftOrReview} />
      </section>
      <section>
        <h2 className="text-xs font-mono font-bold uppercase tracking-wide text-slate-500 mb-3">
          Obsolete SOPs ({obsolete.length})
        </h2>
        <SopTable sops={obsolete} />
      </section>
    </div>
  );
}
