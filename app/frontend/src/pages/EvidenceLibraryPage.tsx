import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listEvidence, uploadUnlinkedEvidence, type EvidenceFile } from '../api/client';

export function EvidenceLibraryPage() {
  const [files, setFiles] = useState<EvidenceFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    listEvidence()
      .then(setFiles)
      .catch((err: Error) => setError(err.message));
  };

  useEffect(load, []);

  const handleFiles = async (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    setUploading(true);
    setError(null);
    // Server rejects any file over 25MB and fails the whole batch, so drop
    // oversize files up front and upload the rest rather than losing everything.
    const MAX = 25 * 1024 * 1024;
    const all = Array.from(picked);
    const tooBig = all.filter((f) => f.size > MAX);
    const uploadable = all.filter((f) => f.size <= MAX);
    try {
      if (uploadable.length > 0) await uploadUnlinkedEvidence(uploadable);
      load();
      if (tooBig.length > 0) {
        setError(`Skipped ${tooBig.length} file${tooBig.length === 1 ? '' : 's'} over 25MB: ${tooBig.map((f) => f.name).join(', ')}`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const picker = (
    <label className="tab-sm" style={{ cursor: 'pointer', alignSelf: 'flex-start' }}>
      {uploading ? 'Uploading…' : 'Select a folder to upload'}
      <input
        type="file"
        aria-label="Select folder to upload as evidence"
        // @ts-expect-error -- non-standard attributes for folder selection
        webkitdirectory=""
        directory=""
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </label>
  );

  if (error) return <div className="flex flex-col gap-8">{picker}<p role="alert">{error}</p></div>;
  if (!files) return <p className="text-sm font-mono" style={{ color: 'var(--ink-dim)' }}>Loading…</p>;

  return (
    <div className="flex flex-col gap-8">
      {picker}
      {files.length === 0 ? (
        <p className="text-sm px-1 py-3" style={{ color: 'var(--ink-dim)' }}>No evidence attached yet.</p>
      ) : (
        <div className="rail-panel">
          <div className="rail-body">
            {files.map((f) => (
              <div className="drawer-item" key={`${f.type}-${f.recordFilename}-${f.attachmentFilename}`}>
                <span>{f.attachmentFilename}</span>
                {f.recordFilename ? (
                  <Link to={`/${f.type}/${f.recordFilename}`} style={{ color: 'var(--navy)' }} className="hover:underline text-xs font-mono">
                    {f.recordFilename}
                  </Link>
                ) : (
                  <span className="text-xs font-mono" style={{ color: 'var(--ink-dim)' }}>Unlinked</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
