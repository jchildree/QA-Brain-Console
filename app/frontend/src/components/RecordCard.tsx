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

  return (
    <Link to={linkTo} className="card">
      <div className="card-head">
        <span className="card-id">{record.id}</span>
        <span className={`stamp ${stamp}`}>{record.status}</span>
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
      <span className="card-type">{typeLabel}</span>
      {desc && <p className="card-desc">{desc}</p>}
      <div className="card-owner">
        Owner <b>{record.owner}</b>
      </div>
      <div className="card-foot">Review due {record.review_date}</div>
    </Link>
  );
}
