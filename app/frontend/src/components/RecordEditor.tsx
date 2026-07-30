import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SaveConflictError, type createRecordApi } from '../api/client';
import { DynamicForm } from './DynamicForm';
import { type BlueprintField } from '../blueprint/sopBlueprint';
import { findBacklinks, type Backlink } from '../api/backlinks';

export function RecordEditor({
  api,
  blueprint,
  filename,
  type,
  renderExtraActions,
}: {
  api: ReturnType<typeof createRecordApi>;
  blueprint: BlueprintField[];
  filename: string;
  type: string;
  renderExtraActions?: (frontmatter: Record<string, unknown>, body: string) => ReactNode;
}) {
  const navigate = useNavigate();
  const [frontmatter, setFrontmatter] = useState<Record<string, unknown>>({});
  const [body, setBody] = useState('');
  const [hash, setHash] = useState<string | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [saved, setSaved] = useState(false);
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);

  const load = () => {
    setLoaded(false);
    api.get(filename).then((record) => {
      setFrontmatter(record.frontmatter);
      setBody(record.body);
      setHash(record.hash);
      setLoaded(true);
      setConflict(false);
      setSaveError(null);
      const id = record.frontmatter.id;
      if (typeof id === 'string') {
        findBacklinks(id).then(setBacklinks).catch(() => setBacklinks([]));
      }
    });
  };

  useEffect(load, [api, filename]);

  if (!loaded) return <p className="text-sm font-mono" style={{ color: 'var(--ink-dim)' }}>Loading…</p>;

  const handleChange = (key: string, value: unknown) => {
    setFrontmatter((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setConflict(false);
    setSaved(false);
    try {
      const result = await api.save(filename, frontmatter, body, hash);
      setHash(result.hash);
      setSaved(true);
    } catch (err) {
      if (err instanceof SaveConflictError) {
        setConflict(true);
      }
      setSaveError(err instanceof Error ? err.message : 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Move this record to Trash?')) return;
    await api.remove(filename);
    navigate(`/${type}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border p-6" style={{ borderColor: 'var(--rule)', background: 'var(--card)' }}>
        <DynamicForm blueprint={blueprint} values={frontmatter} onChange={handleChange} />
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Body</span>
        <textarea
          aria-label="Body"
          className="text-sm px-3 py-2 rounded-lg focus:outline-none font-mono leading-relaxed border"
          style={{ background: 'var(--paper-2)', borderColor: 'var(--rule)', color: 'var(--ink)' }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={20}
        />
      </label>
      <div className="flex items-center gap-4">
        <button type="button" onClick={handleSave} disabled={saving} className="accession-btn">
          Save
        </button>
        <button type="button" onClick={handleDelete} className="accession-btn" style={{ background: 'var(--red)' }}>
          Delete
        </button>
        {renderExtraActions?.(frontmatter, body)}
        {saveError && !conflict && (
          <p role="alert" className="text-xs font-mono" style={{ color: 'var(--red)' }}>
            {saveError}
          </p>
        )}
        {conflict && (
          <p role="alert" className="flex items-center gap-2 text-xs font-mono" style={{ color: 'var(--red)' }}>
            {saveError}
            <button type="button" onClick={load} className="accession-btn" style={{ background: 'var(--red)' }}>
              Reload
            </button>
          </p>
        )}
        {saved && (
          <p role="status" className="text-xs font-mono" style={{ color: 'var(--teal)' }}>
            Saved
          </p>
        )}
      </div>
      {backlinks.length > 0 && (
        <div className="rounded-xl border p-6" style={{ borderColor: 'var(--rule)', background: 'var(--card)' }}>
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Referenced By</span>
          <ul className="flex flex-col gap-1 mt-2">
            {backlinks.map((b) => (
              <li key={`${b.type}-${b.filename}`}>
                <Link to={`/${b.type}/${b.filename}`} className="text-sm font-mono underline">
                  {b.type.toUpperCase()}: {b.id}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
