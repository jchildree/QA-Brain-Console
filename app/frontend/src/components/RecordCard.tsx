import { Link } from 'react-router-dom';
import { stampClass, DEFAULT_STAMP } from '../theme';
import type { RecordSummary } from '../api/client';

const DESCRIPTION_FIELDS: Record<string, string[]> = {
  cap: ['root_cause'],
  incident: ['description'],
  change: ['change_description', 'reason_for_change'],
  audit: ['scope', 'audit_type'],
  training: ['role'],
  meeting: ['meeting_date'],
  sop: ['department'],
};

function descriptionFor(type: string, record: RecordSummary): string {
  const keys = DESCRIPTION_FIELDS[type] ?? [];
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
}

export function RecordCard({
  record,
  type,
  typeLabel,
  linkTo,
  onDelete,
}: {
  record: RecordSummary;
  type: string;
  typeLabel: string;
  linkTo: string;
  onDelete?: (filename: string) => void;
}) {
  const stamp = stampClass[typeLabel] ?? DEFAULT_STAMP;
  const desc = descriptionFor(type, record);
  const title = typeof record.title === 'string' && record.title.trim() ? record.title.trim() : record.id;
  const owner = typeof record.owner === 'string' && record.owner.trim() ? record.owner.trim() : 'Unassigned';
  const reviewDue = typeof record.review_date === 'string' && record.review_date.trim() ? record.review_date.trim() : '—';
  const status = typeof record.status === 'string' && record.status.trim() ? record.status.trim() : 'Unknown';

  return (
    <Link to={linkTo} className="card">
      <div className="card-head">
        <span className="card-id" title={record.id}>{title}</span>
        <span className={`stamp ${stamp}`}>{status}</span>
        {onDelete && (
          <button
            type="button"
            aria-label={`Delete ${record.id}`}
            className="card-delete-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(record.filename);
            }}
          >
            &times;
          </button>
        )}
      </div>
      <span className="card-type">{typeLabel} · {record.id}</span>
      {desc && <p className="card-desc">{desc}</p>}
      <div className="card-owner">
        Owner <b>{owner}</b>
      </div>
      <div className="card-foot">Review due {reviewDue}</div>
    </Link>
  );
}
