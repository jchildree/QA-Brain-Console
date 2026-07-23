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
  if (!files) return <p className="text-sm font-mono text-slate-500">Loading…</p>;

  if (files.length === 0) {
    return <p className="text-sm text-slate-500 font-mono px-1 py-3">No evidence attached yet.</p>;
  }

  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900 text-slate-400 text-xs font-mono uppercase tracking-wide">
            <th className="text-left font-semibold px-4 py-2.5">File</th>
            <th className="text-left font-semibold px-4 py-2.5">Type</th>
            <th className="text-left font-semibold px-4 py-2.5">Record</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {files.map((f) => (
            <tr key={`${f.type}-${f.recordFilename}-${f.attachmentFilename}`} className="hover:bg-slate-900/60 transition-colors">
              <td className="px-4 py-2.5 font-mono text-slate-200">{f.attachmentFilename}</td>
              <td className="px-4 py-2.5 text-slate-300 uppercase font-mono text-xs">{f.type}</td>
              <td className="px-4 py-2.5">
                <Link to={`/${f.type}/${f.recordFilename}`} className="text-green-400 hover:underline">
                  {f.recordFilename}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
