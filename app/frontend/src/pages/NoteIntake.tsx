import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createRecordApi } from '../api/client';
import { notesBlueprint } from '../blueprint/notesBlueprint';
import { DynamicForm } from '../components/DynamicForm';

const notesApi = createRecordApi('notes');

export function NoteIntake() {
  const navigate = useNavigate();
  const location = useLocation();
  const [fields, setFields] = useState<Record<string, unknown>>({});
  const [body, setBody] = useState((location.state as { rawText?: string } | null)?.rawText ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleChange = (key: string, value: unknown) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const created = await notesApi.create(fields, body);
      navigate(`/notes/${created.filename}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border p-6" style={{ borderColor: 'var(--rule)', background: 'var(--card)' }}>
        <DynamicForm blueprint={notesBlueprint} values={fields} onChange={handleChange} />
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
        {saveError && (
          <p role="alert" className="text-xs font-mono" style={{ color: 'var(--red)' }}>
            {saveError}
          </p>
        )}
      </div>
    </div>
  );
}
