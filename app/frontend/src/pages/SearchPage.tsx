import { useState } from 'react';
import { Link } from 'react-router-dom';
import { search, type SearchResult } from '../api/client';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setError(null);
    try {
      const found = await search(query.trim());
      setResults(found);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end gap-3 flex-wrap">
        <label className="flex flex-col gap-1.5 flex-1" style={{ minWidth: 240 }}>
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>
            Search all records and notes
          </span>
          <input
            aria-label="Search all records and notes"
            className="text-sm px-3 py-2 rounded-lg focus:outline-none font-mono border"
            style={{ background: 'var(--paper-2)', borderColor: 'var(--rule)', color: 'var(--ink)' }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </label>
        <button type="button" onClick={handleSearch} className="accession-btn">
          Search
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs font-mono" style={{ color: 'var(--red)' }}>
          {error}
        </p>
      )}
      {searched && results.length === 0 && (
        <p className="text-sm px-1 py-3" style={{ color: 'var(--ink-dim)' }}>No results.</p>
      )}
      {results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((r) => (
            <li key={`${r.urlSlug}-${r.filename}`}>
              <Link to={`/${r.type}/${r.filename}`} className="card">
                <div className="card-head">
                  <span className="card-id">{r.id}</span>
                </div>
                <span className="card-type">{r.type.toUpperCase()}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
