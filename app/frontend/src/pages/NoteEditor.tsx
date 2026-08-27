import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecordEditor } from '../components/RecordEditor';
import { createRecordApi, listEvidence, uploadAttachment, type EvidenceFile } from '../api/client';
import { notesBlueprint, notesBlueprintAdmin } from '../blueprint/notesBlueprint';
import { useAuth } from '../context/AuthContext';

const notesApi = createRecordApi('notes');

const PROMOTE_TARGETS = [
  { type: 'sop', label: 'SOP' },
  { type: 'cap', label: 'CAP' },
  { type: 'incident', label: 'Incident' },
  { type: 'change', label: 'Change' },
  { type: 'audit', label: 'Audit' },
  { type: 'training', label: 'Training' },
  { type: 'meeting', label: 'Meeting Minutes' },
];

// Attaching a file here as a "Source" is what populates the Evidence Library --
// that page just scans every record type's attachments/ folder on disk, so
// uploading through the existing generic backend route is the whole fix.
function SourcesPanel({ filename, autoFill }: { filename: string; autoFill: (fields: Record<string, unknown>) => number }) {
  const [sources, setSources] = useState<EvidenceFile[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoFilledCount, setAutoFilledCount] = useState<number | null>(null);

  const load = () => {
    listEvidence()
      .then((all) => setSources(all.filter((f) => f.type === 'notes' && f.recordFilename === filename)))
      .catch((err: Error) => setError(err.message));
  };

  useEffect(load, [filename]);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setAutoFilledCount(null);
    try {
      const { extracted } = await uploadAttachment('notes', filename, file);
      if (extracted) {
        setAutoFilledCount(autoFill(extracted));
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add source');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border p-6" style={{ borderColor: 'var(--rule)', background: 'var(--card)' }}>
      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Source</span>
      <div className="flex flex-col gap-2 mt-2">
        {sources && sources.length > 0 && (
          <ul className="flex flex-col gap-1">
            {sources.map((f) => (
              <li key={f.attachmentFilename} className="text-sm font-mono">
                {f.attachmentFilename}
              </li>
            ))}
          </ul>
        )}
        {sources && sources.length === 0 && (
          <p className="text-xs font-mono" style={{ color: 'var(--ink-dim)' }}>
            No source attached yet.
          </p>
        )}
        <label className="accession-btn self-start" style={{ cursor: uploading ? 'default' : 'pointer' }}>
          {uploading ? 'Uploading…' : '+ Add Source'}
          <input
            aria-label="Add Source"
            type="file"
            disabled={uploading}
            onChange={(e) => handleUpload(e.target.files?.[0])}
            style={{ display: 'none' }}
          />
        </label>
        {error && (
          <p role="alert" className="text-xs font-mono" style={{ color: 'var(--red)' }}>
            {error}
          </p>
        )}
        {autoFilledCount !== null && autoFilledCount > 0 && (
          <p className="text-xs font-mono" style={{ color: 'var(--ink-dim)' }}>
            Filled {autoFilledCount} empty field{autoFilledCount === 1 ? '' : 's'} from this source -- review before saving.
          </p>
        )}
      </div>
    </div>
  );
}

export function NoteEditor({ filename }: { filename: string }) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  return (
    <RecordEditor
      api={notesApi}
      blueprint={isAdmin ? notesBlueprintAdmin : notesBlueprint}
      filename={filename}
      type="notes"
      renderExtraActions={(frontmatter, body) => (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>
            Promote to
          </span>
          {PROMOTE_TARGETS.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              className="accession-btn"
              onClick={() => navigate(`/${type}/new`, { state: { rawText: body, title: frontmatter.title } })}
            >
              {label}
            </button>
          ))}
          {!isAdmin && typeof frontmatter.assigned_to === 'string' && frontmatter.assigned_to && (
            <span className="text-xs font-mono" style={{ color: 'var(--ink-dim)' }}>
              Assigned to: {frontmatter.assigned_to}
            </span>
          )}
        </div>
      )}
      renderExtra={(_frontmatter, _body, autoFill) => <SourcesPanel filename={filename} autoFill={autoFill} />}
    />
  );
}
