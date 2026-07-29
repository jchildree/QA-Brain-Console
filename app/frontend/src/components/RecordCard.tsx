import { Link } from 'react-router-dom';
import { stampClass, DEFAULT_STAMP } from '../theme';
import type { RecordSummary } from '../api/client';

const DESCRIPTION_FIELDS: Record<string, string[]> = {
  cap: ['root_cause'],
  incident: ['description'],
  change: ['change_description', 'reason_for_change'],
  audit: ['scope', 'audit_type'],
  training: ['role'],
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
}: {
  record: RecordSummary;
  type: string;
  typeLabel: string;
  linkTo: string;
}) {
  const stamp = stampClass[typeLabel] ?? DEFAULT_STAMP;
  const desc = descriptionFor(type, record);

  return (
    <Link to={linkTo} className="card">
      <div className="card-head">
        <span className="card-id">{record.id}</span>
        <span className={`stamp ${stamp}`}>{record.status}</span>
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
