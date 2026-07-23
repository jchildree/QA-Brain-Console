import { useState } from 'react';
import { extractFromText } from '../api/client';
import { DynamicForm } from '../components/DynamicForm';
import { sopBlueprint } from '../blueprint/sopBlueprint';

export function Intake() {
  const [rawText, setRawText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [fields, setFields] = useState<Record<string, unknown>>({});

  const handleExtract = async () => {
    setExtracting(true);
    const result = await extractFromText(rawText);
    setFields(result);
    setExtracting(false);
  };

  const handleChange = (key: string, value: unknown) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-mono font-bold uppercase tracking-wide text-slate-400">Raw notes</span>
          <textarea
            aria-label="Raw notes"
            className="bg-slate-950 border border-slate-800 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-green-500 text-slate-200 font-mono leading-relaxed"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={8}
          />
        </label>
        <button
          type="button"
          onClick={handleExtract}
          disabled={!rawText.trim() || extracting}
          className="rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-40 disabled:hover:bg-green-500/10 transition-colors px-4 py-2 text-sm font-bold self-start"
        >
          {extracting ? 'Extracting…' : 'Extract'}
        </button>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
        <DynamicForm blueprint={sopBlueprint} values={fields} onChange={handleChange} />
      </div>
    </div>
  );
}
