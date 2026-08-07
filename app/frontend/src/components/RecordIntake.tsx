import { useEffect, useState } from 'react';
import { type createRecordApi } from '../api/client';
import { DynamicForm } from './DynamicForm';
import { type BlueprintField } from '../blueprint/sopBlueprint';

// Defensive: the AI is told to strip markdown syntax from an extracted title,
// but strip any leading #/* markers again here in case it doesn't comply.
function stripMarkdownTitle(title: string): string {
  return title.replace(/^[#*\s]+/, '').replace(/[*\s]+$/, '');
}

export function RecordIntake({
  api,
  blueprint,
  onSave,
  initialRawText = '',
  initialTitle = '',
  initialFields = {},
}: {
  api: ReturnType<typeof createRecordApi>;
  blueprint: BlueprintField[];
  onSave: (frontmatter: Record<string, unknown>, body: string) => Promise<void>;
  initialRawText?: string;
  initialTitle?: string;
  initialFields?: Record<string, unknown>;
}) {
  const [rawText, setRawText] = useState(initialRawText);
  // Promoting a note (or dropping a file) carries its text over as the actual
  // body too, not just the extraction source -- previously this stayed empty
  // until the user manually copied it in.
  const [body, setBody] = useState(initialRawText);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  // A known-good title (a note's own title, or an uploaded file's name) beats
  // whatever the AI guesses from raw text -- extraction fills the rest of the
  // form but must not clobber this.
  const [fields, setFields] = useState<Record<string, unknown>>({
    ...initialFields,
    ...(initialTitle ? { title: initialTitle } : {}),
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleExtract = async () => {
    setExtracting(true);
    setExtractError(null);
    try {
      const result = await api.extract(rawText);
      const extractedTitle = typeof result.title === 'string' ? stripMarkdownTitle(result.title) : result.title;
      setFields((prev) => ({
        ...result,
        title: prev.title || extractedTitle,
        version: prev.version || result.version || 'v1',
      }));
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  // Auto-run extraction once when arriving with text already in hand (promote
  // flow, dropped file) so the form is populated without an extra manual click.
  useEffect(() => {
    if (initialRawText.trim()) {
      handleExtract();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        {extractError && (
          <p role="alert" className="text-xs font-mono" style={{ color: 'var(--red)' }}>
            {extractError}
          </p>
        )}
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
