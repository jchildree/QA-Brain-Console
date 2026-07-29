import { useEffect, useState } from 'react';
import { createTrashApi, type RecordSummary } from '../api/client';

const PREFIX_LABEL: Record<string, string> = {
  SOP: 'SOP',
  CAP: 'CAP',
  INC: 'Incident',
  CHG: 'Change',
  AUD: 'Audit',
  TRN: 'Training',
};

function labelFor(record: RecordSummary): string {
  const prefix = record.id.split('-')[0];
  return PREFIX_LABEL[prefix] ?? prefix;
}

const trashApi = createTrashApi();

export function TrashPage() {
  const [records, setRecords] = useState<RecordSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    trashApi
      .list()
      .then(setRecords)
      .catch((err: Error) => setError(err.message));
  };

  useEffect(load, []);

  const handleRestore = async (filename: string) => {
    await trashApi.restore(filename);
    load();
  };

  const handlePurge = async (filename: string) => {
    if (!confirm('Permanently delete this record? This cannot be undone.')) return;
    await trashApi.purge(filename);
    load();
  };

  if (error) return <p role="alert">{error}</p>;
  if (!records) return <p className="text-sm font-mono" style={{ color: 'var(--ink-dim)' }}>Loading…</p>;

  if (records.length === 0) {
    return <p className="text-sm px-1 py-3" style={{ color: 'var(--ink-dim)' }}>Trash is empty.</p>;
  }

  return (
    <div className="rail-panel">
      <div className="rail-body">
        {records.map((record) => (
          <div className="drawer-item" key={record.filename}>
            <span>
              {labelFor(record)} <b>{record.id}</b>
            </span>
            <div className="flex items-center gap-3">
              <button type="button" className="accession-btn" onClick={() => handleRestore(record.filename)}>
                Restore
              </button>
              <button
                type="button"
                className="accession-btn"
                style={{ background: 'var(--red)' }}
                onClick={() => handlePurge(record.filename)}
              >
                Permanently Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
