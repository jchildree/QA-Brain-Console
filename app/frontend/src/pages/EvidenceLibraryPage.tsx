import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listEvidence, type EvidenceFile } from '../api/client';

export function EvidenceLibraryPage() {
  const [files, setFiles] = useState<EvidenceFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listEvidence()
      .then(setFiles)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <p role="alert">{error}</p>;
  if (!files) return <p className="text-sm font-mono" style={{ color: 'var(--ink-dim)' }}>Loading…</p>;

  if (files.length === 0) {
    return <p className="text-sm px-1 py-3" style={{ color: 'var(--ink-dim)' }}>No evidence attached yet.</p>;
  }

  return (
    <div className="rail-panel">
      <div className="rail-body">
        {files.map((f) => (
          <div className="drawer-item" key={`${f.type}-${f.recordFilename}-${f.attachmentFilename}`}>
            <span>{f.attachmentFilename}</span>
            <Link to={`/${f.type}/${f.recordFilename}`} style={{ color: 'var(--navy)' }} className="hover:underline text-xs font-mono">
              {f.recordFilename}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
