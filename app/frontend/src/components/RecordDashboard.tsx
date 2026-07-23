import { useEffect, useState } from 'react';
import { type RecordSummary, type createRecordApi } from '../api/client';
import { StatusPill } from './StatusPill';

export function isOverdue(record: RecordSummary): boolean {
  return record.status === 'Approved' && new Date(record.review_date) < new Date();
}

function RecordTable({ records }: { records: RecordSummary[] }) {
  if (records.length === 0) {
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
          {records.map((record) => (
            <tr key={record.filename} className="hover:bg-slate-900/60 transition-colors">
              <td className="px-4 py-2.5 font-mono text-slate-200">{record.id}</td>
              <td className="px-4 py-2.5 text-slate-300">{record.version}</td>
              <td className="px-4 py-2.5">
                <StatusPill status={record.status} />
              </td>
              <td className="px-4 py-2.5 text-slate-300">{record.department}</td>
              <td className="px-4 py-2.5 text-slate-300">{record.review_date}</td>
              <td className="px-4 py-2.5 text-slate-300">{record.owner}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RecordDashboard({ api, title }: { api: ReturnType<typeof createRecordApi>; title: string }) {
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .list()
      .then(setRecords)
      .catch((err: Error) => setError(err.message));
  }, [api]);

  if (error) return <p role="alert">{error}</p>;

  const controlled = records.filter((r) => r.status !== 'Obsolete');
  const overdue = records.filter(isOverdue);
  const inDraftOrReview = records.filter((r) => r.status === 'Draft' || r.status === 'In Review');
  const obsolete = records.filter((r) => r.status === 'Obsolete');

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-xs font-mono font-bold uppercase tracking-wide text-slate-400 mb-3">
          All Controlled {title}s ({controlled.length})
        </h2>
        <RecordTable records={controlled} />
      </section>
      <section>
        <h2 className="text-xs font-mono font-bold uppercase tracking-wide text-red-400 mb-3">
          Overdue for Review ({overdue.length})
        </h2>
        <RecordTable records={overdue} />
      </section>
      <section>
        <h2 className="text-xs font-mono font-bold uppercase tracking-wide text-amber-400 mb-3">
          In Draft / Review ({inDraftOrReview.length})
        </h2>
        <RecordTable records={inDraftOrReview} />
      </section>
      <section>
        <h2 className="text-xs font-mono font-bold uppercase tracking-wide text-slate-500 mb-3">
          Obsolete {title}s ({obsolete.length})
        </h2>
        <RecordTable records={obsolete} />
      </section>
    </div>
  );
}
