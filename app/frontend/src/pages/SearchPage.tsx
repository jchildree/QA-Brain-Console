import { useState } from 'react';
import { Link } from 'react-router-dom';
import { search, type SearchResult } from '../api/client';
import { StatusPill } from '../components/StatusPill';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setSearching(true);
    setError(null);
    try {
      setResults(await search(query));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex items-end gap-3">
        <label className="flex flex-col gap-1.5 flex-1">
          <span className="text-xs font-mono font-bold uppercase tracking-wide text-slate-400">Search</span>
          <input
            aria-label="Search"
            className="bg-slate-950 border border-slate-800 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-green-500 text-slate-200 font-mono"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </label>
        <button
          type="button"
          onClick={handleSearch}
          disabled={!query.trim() || searching}
          className="rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-40 disabled:hover:bg-green-500/10 transition-colors px-4 py-2 text-sm font-bold"
        >
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-400 font-mono">
          {error}
        </p>
      )}

      {results && results.length === 0 && (
        <p className="text-sm text-slate-500 font-mono px-1">No results.</p>
      )}

      {results && results.length > 0 && (
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 text-slate-400 text-xs font-mono uppercase tracking-wide">
                <th className="text-left font-semibold px-4 py-2.5">ID</th>
                <th className="text-left font-semibold px-4 py-2.5">Type</th>
                <th className="text-left font-semibold px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {results.map((r) => (
                <tr key={`${r.type}-${r.filename}`} className="hover:bg-slate-900/60 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-slate-200">
                    <Link to={`/${r.type}/${r.filename}`} className="hover:underline text-green-400">
                      {r.id}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-300 uppercase font-mono text-xs">{r.type}</td>
                  <td className="px-4 py-2.5">
                    <StatusPill status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
