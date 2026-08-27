import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { type RecordSummary, type createRecordApi } from '../api/client';
import { RecordCard } from './RecordCard';
import { StripChart } from './StripChart';
import { DonutChart } from './DonutChart';
import { dailyCumulativeCounts, statusBreakdown, STATUS_COLORS } from '../api/chartData';
import { stampClass, DEFAULT_STAMP } from '../theme';

export function isOverdue(record: RecordSummary): boolean {
  return record.status === 'Approved' && new Date(record.review_date) < new Date();
}

function CardGrid({
  records,
  type,
  typeLabel,
  onDelete,
}: {
  records: RecordSummary[];
  type: string;
  typeLabel: string;
  onDelete: (filename: string) => void;
}) {
  if (records.length === 0) {
    return <p className="text-sm px-1 py-3" style={{ color: 'var(--ink-dim)' }}>No records.</p>;
  }
  return (
    <div className="specimen-grid">
      {records.map((record) => (
        <RecordCard
          key={record.filename}
          record={record}
          type={type}
          typeLabel={typeLabel}
          linkTo={`/${type}/${record.filename}`}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

const STAMP_COLOR_VAR: Record<string, string> = {
  'stamp-sop': '--teal',
  'stamp-inc': '--red',
  'stamp-cap': '--gold',
  'stamp-chg': '--navy-dim',
  'stamp-trn': '--ink-dim',
  'stamp-aud': '--gold',
  'stamp-mtg': '--plum',
};

const sectionHeading: CSSProperties = {
  fontSize: '10px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontWeight: 700,
  marginBottom: '10px',
};

export function RecordDashboard({
  api,
  title,
  type,
  renderExtraCharts,
}: {
  api: ReturnType<typeof createRecordApi>;
  title: string;
  type: string;
  renderExtraCharts?: (records: RecordSummary[]) => ReactNode;
}) {
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState('');

  useEffect(() => {
    api
      .list()
      .then(setRecords)
      .catch((err: Error) => setError(err.message));
  }, [api]);

  const handleDelete = async (filename: string) => {
    if (!confirm('Move this record to Trash?')) return;
    try {
      await api.remove(filename);
      setRecords((prev) => prev.filter((r) => r.filename !== filename));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete record.');
    }
  };

  if (error) return <p role="alert">{error}</p>;

  // Only some record types (e.g. Meeting Minutes) use a "folder" field to
  // group records -- the filter stays hidden for types that never set it.
  const folders = Array.from(new Set(records.map((r) => (typeof r.folder === 'string' ? r.folder : '')).filter(Boolean))).sort();

  const q = query.trim().toLowerCase();
  const searched = q ? records.filter((r) => JSON.stringify(r).toLowerCase().includes(q)) : records;
  const visible = folder ? searched.filter((r) => r.folder === folder) : searched;

  const overdue = visible.filter(isOverdue);
  const approved = visible.filter((r) => r.status === 'Approved' && !isOverdue(r));
  const inDraftOrReview = visible.filter((r) => r.status === 'Draft' || r.status === 'In Review');
  const obsolete = visible.filter((r) => r.status === 'Obsolete');
  // Records whose status isn't one of the 4 lifecycle buckets would otherwise
  // render no card at all (counted but invisible) -- gather them here.
  const shown = new Set([...overdue, ...approved, ...inDraftOrReview, ...obsolete].map((r) => r.filename));
  const uncategorized = visible.filter((r) => !shown.has(r.filename));
  const stamp = stampClass[title] ?? DEFAULT_STAMP;
  const colorVar = STAMP_COLOR_VAR[stamp] ?? '--gold';

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end gap-3 flex-wrap">
        <label className="flex flex-col gap-1.5 flex-1" style={{ minWidth: 200 }}>
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>
            Search {title}s
          </span>
          <input
            aria-label={`Search ${title}s`}
            className="text-sm px-3 py-2 rounded-lg focus:outline-none font-mono border"
            style={{ background: 'var(--paper-2)', borderColor: 'var(--rule)', color: 'var(--ink)' }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {folders.length > 0 && (
          <label className="flex flex-col gap-1.5" style={{ minWidth: 160 }}>
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Folder</span>
            <select
              aria-label="Folder"
              className="text-sm px-3 py-2 rounded-lg focus:outline-none font-mono border"
              style={{ background: 'var(--paper-2)', borderColor: 'var(--rule)', color: 'var(--ink)' }}
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            >
              <option value="">All folders</option>
              {folders.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>
        )}
        <Link to={`/${type}/new`} className="tab-sm">
          + New {title}
        </Link>
      </div>
      <details className="metrics-section" open>
        <summary className="metrics-summary">
          Metrics
          <span className="chart-quip" style={{ marginLeft: 10 }}>collapse to focus on the register</span>
        </summary>
        <div className="flex flex-col gap-8" style={{ marginTop: 16 }}>
          <StripChart
            title={`${title} Register, 14-Day Trace`}
            quip="every specimen, catalogued and dated"
            series={[
              {
                label: title,
                colorVar,
                data: dailyCumulativeCounts(records.map((r) => r.id)),
              },
            ]}
            readouts={[
              { label: 'Total on file', value: String(records.length), direction: 'flat' },
              { label: 'Overdue for review', value: String(overdue.length), direction: overdue.length > 0 ? 'up' : 'flat' },
              { label: 'Draft / in review', value: String(inDraftOrReview.length), direction: 'flat' },
              { label: 'Obsolete', value: String(obsolete.length), direction: 'down' },
            ]}
          />
          <div className="chart-panel">
            <div className="chart-head">
              <span className="chart-title">{title} Status Breakdown</span>
              <div className="chart-legend">
                {STATUS_COLORS.map((s) => (
                  <span key={s.label}>
                    <i className="swatch" style={{ background: `var(${s.colorVar})` }} />
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="donut-row">
              <DonutChart title={title} data={statusBreakdown(visible)} />
            </div>
          </div>
          {renderExtraCharts?.(visible)}
        </div>
      </details>
      <section>
        <h2 style={{ ...sectionHeading, color: 'var(--red)' }}>Overdue for Review ({overdue.length})</h2>
        <CardGrid records={overdue} type={type} typeLabel={title} onDelete={handleDelete} />
      </section>
      <section>
        <h2 style={{ ...sectionHeading, color: 'var(--teal)' }}>Approved ({approved.length})</h2>
        <CardGrid records={approved} type={type} typeLabel={title} onDelete={handleDelete} />
      </section>
      <section>
        <h2 style={{ ...sectionHeading, color: 'var(--gold)' }}>In Draft / Review ({inDraftOrReview.length})</h2>
        <CardGrid records={inDraftOrReview} type={type} typeLabel={title} onDelete={handleDelete} />
      </section>
      <section>
        <h2 style={{ ...sectionHeading, color: 'var(--ink-dim)' }}>
          Obsolete {title}s ({obsolete.length})
        </h2>
        <CardGrid records={obsolete} type={type} typeLabel={title} onDelete={handleDelete} />
      </section>
      {uncategorized.length > 0 && (
        <section>
          <h2 style={{ ...sectionHeading, color: 'var(--ink-dim)' }}>
            Uncategorized ({uncategorized.length})
          </h2>
          <CardGrid records={uncategorized} type={type} typeLabel={title} onDelete={handleDelete} />
        </section>
      )}
    </div>
  );
}
