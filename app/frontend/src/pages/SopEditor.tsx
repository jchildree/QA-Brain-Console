import { useEffect, useState } from 'react';
import { getSop, saveSop } from '../api/client';
import { DynamicForm } from '../components/DynamicForm';
import { sopBlueprint } from '../blueprint/sopBlueprint';

export function SopEditor({ filename }: { filename: string }) {
  const [frontmatter, setFrontmatter] = useState<Record<string, unknown>>({});
  const [body, setBody] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSop(filename).then((sop) => {
      setFrontmatter(sop.frontmatter);
      setBody(sop.body);
      setLoaded(true);
    });
  }, [filename]);

  if (!loaded) return <p className="text-sm font-mono text-slate-500">Loading…</p>;

  const handleChange = (key: string, value: unknown) => {
    setFrontmatter((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await saveSop(filename, frontmatter, body);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save SOP');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <DynamicForm blueprint={sopBlueprint} values={frontmatter} onChange={handleChange} />
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-mono font-bold uppercase tracking-wide text-slate-400">Body</span>
        <textarea
          aria-label="Body"
          className="bg-slate-950 border border-slate-800 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-green-500 text-slate-200 font-mono leading-relaxed"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={20}
        />
      </label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-40 disabled:hover:bg-green-500/10 transition-colors px-4 py-2 text-sm font-bold self-start"
        >
          Save
        </button>
        {saveError && (
          <p role="alert" className="text-xs text-red-400 font-mono">
            {saveError}
          </p>
        )}
        {saved && (
          <p role="status" className="text-xs text-green-400 font-mono">
            Saved
          </p>
        )}
      </div>
    </div>
  );
}
