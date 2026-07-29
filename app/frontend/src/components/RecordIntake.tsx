import { useState } from 'react';
import { type createRecordApi } from '../api/client';
import { DynamicForm } from './DynamicForm';
import { type BlueprintField } from '../blueprint/sopBlueprint';

export function RecordIntake({
  api,
  blueprint,
  onSave,
  initialRawText = '',
}: {
  api: ReturnType<typeof createRecordApi>;
  blueprint: BlueprintField[];
  onSave: (frontmatter: Record<string, unknown>, body: string) => Promise<void>;
  initialRawText?: string;
}) {
  const [rawText, setRawText] = useState(initialRawText);
  const [body, setBody] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [fields, setFields] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleExtract = async () => {
    setExtracting(true);
    const result = await api.extract(rawText);
    setFields(result);
    setExtracting(false);
  };

  const handleChange = (key: string, value: unknown) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(fields, body);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border p-6 flex flex-col gap-4" style={{ borderColor: 'var(--rule)', background: 'var(--card)' }}>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Raw notes</span>
          <textarea
            aria-label="Raw notes"
            className="text-sm px-3 py-2 rounded-lg focus:outline-none font-mono leading-relaxed border"
            style={{ background: 'var(--paper-2)', borderColor: 'var(--rule)', color: 'var(--ink)' }}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={8}
          />
        </label>
        <button
          type="button"
          onClick={handleExtract}
          disabled={!rawText.trim() || extracting}
          className="accession-btn"
        >
          {extracting ? 'Extracting…' : 'Extract'}
        </button>
      </div>
      <div className="rounded-xl border p-6" style={{ borderColor: 'var(--rule)', background: 'var(--card)' }}>
        <DynamicForm blueprint={blueprint} values={fields} onChange={handleChange} />
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
