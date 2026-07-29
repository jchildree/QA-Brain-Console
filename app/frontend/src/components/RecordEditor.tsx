import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type createRecordApi } from '../api/client';
import { DynamicForm } from './DynamicForm';
import { type BlueprintField } from '../blueprint/sopBlueprint';

export function RecordEditor({
  api,
  blueprint,
  filename,
  type,
}: {
  api: ReturnType<typeof createRecordApi>;
  blueprint: BlueprintField[];
  filename: string;
  type: string;
}) {
  const navigate = useNavigate();
  const [frontmatter, setFrontmatter] = useState<Record<string, unknown>>({});
  const [body, setBody] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get(filename).then((record) => {
      setFrontmatter(record.frontmatter);
      setBody(record.body);
      setLoaded(true);
    });
  }, [api, filename]);

  if (!loaded) return <p className="text-sm font-mono" style={{ color: 'var(--ink-dim)' }}>Loading…</p>;

  const handleChange = (key: string, value: unknown) => {
    setFrontmatter((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await api.save(filename, frontmatter, body);
      setSaved(true);
    } catch (err) {
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
        {saveError && (
          <p role="alert" className="text-xs font-mono" style={{ color: 'var(--red)' }}>
            {saveError}
          </p>
        )}
        {saved && (
          <p role="status" className="text-xs font-mono" style={{ color: 'var(--teal)' }}>
            Saved
          </p>
        )}
      </div>
    </div>
  );
}
