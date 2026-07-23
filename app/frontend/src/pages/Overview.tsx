import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSops, createRecordApi, type SopSummary, type RecordSummary } from '../api/client';
import { isOverdue } from './Dashboard';
import { recordTypeBadge, DEFAULT_BADGE } from '../theme';

const LIVE_RECORD_TYPES = [
  { type: 'CAP', to: '/cap', label: 'Corrective Action Plan', api: createRecordApi('cap') },
  { type: 'Incident', to: '/incident', label: 'Incident Report', api: createRecordApi('incident') },
  { type: 'Change', to: '/change', label: 'Change Control', api: createRecordApi('change') },
  { type: 'Audit', to: '/audit', label: 'Quality Audit', api: createRecordApi('audit') },
  { type: 'Training', to: '/training', label: 'Training Record', api: createRecordApi('training') },
];

const STAGGER = [
  { mt: 0, tx: 0, rot: -0.5 },
  { mt: 14, tx: 4, rot: 0.4 },
  { mt: 4, tx: -3, rot: -0.3 },
  { mt: 22, tx: 2, rot: 0.5 },
  { mt: 9, tx: -5, rot: -0.4 },
];

function cardOffset(i: number) {
  const s = STAGGER[i % STAGGER.length];
  return {
    marginTop: s.mt,
    transform: `translateX(${s.tx}px) rotate(${s.rot}deg)`,
  };
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  const pct = total > 0 ? (count / total) * 100 : 0;

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    el.style.width = '0%';
    const id = requestAnimationFrame(() => {
      el.style.transition = 'width 0.9s ease-out';
      el.style.width = `${pct}%`;
    });
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline text-xs font-mono">
        <span className="uppercase tracking-wide text-[#9a9270]">{label}</span>
        <span className="text-lg font-extrabold text-[#efe8cf]">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-[#3a3421] overflow-hidden">
        <div ref={barRef} className={`h-full rounded-full ${color}`} />
      </div>
    </div>
  );
}

export function Overview() {
  const [sops, setSops] = useState<SopSummary[]>([]);
  const [records, setRecords] = useState<Record<string, RecordSummary[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSops()
      .then(setSops)
      .catch((err: Error) => setError(err.message));
    LIVE_RECORD_TYPES.forEach(({ type, api }) => {
      api
        .list()
        .then((list) => setRecords((prev) => ({ ...prev, [type]: list })))
        .catch(() => {});
    });
  }, []);

  if (error) return <p role="alert">{error}</p>;

  const overdue = sops.filter(isOverdue).length;
  const draftOrReview = sops.filter((s) => s.status === 'Draft' || s.status === 'In Review').length;
  const approved = sops.filter((s) => s.status === 'Approved').length;
  const obsolete = sops.filter((s) => s.status === 'Obsolete').length;

  return (
    <div className="rounded-2xl bg-[#15130c] border border-[#3a3421] p-6 flex flex-col gap-6">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold tracking-tight text-[#efe8cf]">Console Overview</h1>
        <span className="text-xs font-mono text-[#9a9270] italic">the vault has a pulse -- watch it beat</span>
      </div>

      <div className="rounded-2xl bg-[#1e1b12] border border-[#3a3421] shadow-lg p-5 grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatusBar label="Overdue" count={overdue} total={sops.length} color="bg-[#e08272]" />
        <StatusBar label="Draft / Review" count={draftOrReview} total={sops.length} color="bg-[#e0bb62]" />
        <StatusBar label="Approved" count={approved} total={sops.length} color="bg-[#59d1b6]" />
        <StatusBar label="Obsolete" count={obsolete} total={sops.length} color="bg-[#9a9270]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(225px,1fr))] gap-3 content-start">
          <div
            style={cardOffset(0)}
            className="rounded-2xl bg-[#1e1b12] border border-[#3a3421] shadow p-4 flex flex-col gap-2"
          >
            <div className="flex justify-between items-start gap-2">
              <span className="font-mono text-base font-extrabold text-[#efe8cf]">SOP</span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase ${recordTypeBadge.SOP ?? DEFAULT_BADGE}`}
              >
                Live
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[#9a9270]">Standard Operating Procedure</span>
            <p className="text-sm text-[#efe8cf]">
              {sops.length} total, {overdue} overdue for review
            </p>
            <Link to="/sop" className="text-xs font-mono text-[#e0bb62] hover:underline mt-1">
              Open register &rarr;
            </Link>
          </div>

          {LIVE_RECORD_TYPES.map(({ type, to, label }, i) => {
            const list = records[type] ?? [];
            const typeOverdue = list.filter(isOverdue).length;
            return (
              <div
                key={type}
                style={cardOffset(i + 1)}
                className="rounded-2xl bg-[#1e1b12] border border-[#3a3421] shadow p-4 flex flex-col gap-2"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="font-mono text-base font-extrabold text-[#efe8cf]">{type}</span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase ${recordTypeBadge[type] ?? DEFAULT_BADGE}`}
                  >
                    Live
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-[#9a9270]">{label}</span>
                <p className="text-sm text-[#efe8cf]">
                  {list.length} total, {typeOverdue} overdue for review
                </p>
                <Link to={to} className="text-xs font-mono text-[#e0bb62] hover:underline mt-1">
                  Open register &rarr;
                </Link>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-[#1e1b12] border border-[#3a3421] shadow overflow-hidden">
            <div className="text-[10px] uppercase tracking-widest text-[#9a9270] px-4 py-2.5 border-b border-[#3a3421]">
              Drawers Requiring Attention
            </div>
            <div className="px-4 py-1">
              <div className="flex justify-between items-center py-2 border-b border-[#3a3421]">
                <span className="text-sm text-[#efe8cf]">Overdue reviews</span>
                <span className="font-extrabold text-lg text-[#e08272]">{overdue}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-[#efe8cf]">Draft / in review</span>
                <span className="font-extrabold text-lg text-[#e0bb62]">{draftOrReview}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#1e1b12] border border-[#3a3421] shadow overflow-hidden">
            <div className="text-[10px] uppercase tracking-widest text-[#9a9270] px-4 py-2.5 border-b border-[#3a3421]">
              Cross-Reference
            </div>
            <p className="text-xs text-[#9a9270] px-4 py-3">
              Cross-record links become available once related_documents linking ships.
            </p>
          </div>

          <div className="rounded-2xl bg-[#1e1b12] border border-[#3a3421] shadow overflow-hidden">
            <div className="text-[10px] uppercase tracking-widest text-[#9a9270] px-4 py-2.5 border-b border-[#3a3421]">
              New Accession
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              <p className="text-xs text-[#9a9270]">Paste raw notes or upload evidence -- Intake auto-classifies it into the right record.</p>
              <Link
                to="/sop/new"
                className="self-start rounded-full bg-[#e0bb62] text-[#15130c] font-mono text-xs font-bold uppercase tracking-wide px-4 py-2 hover:opacity-85 transition-opacity"
              >
                Open Intake
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
