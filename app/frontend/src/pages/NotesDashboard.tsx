import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createRecordApi, type RecordSummary } from '../api/client';
import { NoteCard } from '../components/NoteCard';
import { useAuth } from '../context/AuthContext';

const notesApi = createRecordApi('notes');

export function NotesDashboard() {
  const { username } = useAuth();
  const [notes, setNotes] = useState<RecordSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState('');
  const [assignedToMe, setAssignedToMe] = useState(false);

  useEffect(() => {
    notesApi
      .list()
      .then(setNotes)
      .catch((err: Error) => setError(err.message));
  }, []);

  const handleDelete = async (filename: string) => {
    if (!confirm('Move this note to Trash?')) return;
    await notesApi.remove(filename);
    setNotes((prev) => prev.filter((n) => n.filename !== filename));
  };

  if (error) return <p role="alert">{error}</p>;

  const q = query.trim().toLowerCase();
  const searched = q ? notes.filter((n) => JSON.stringify(n).toLowerCase().includes(q)) : notes;
  const folders = Array.from(new Set(notes.map((n) => (typeof n.folder === 'string' ? n.folder : '')).filter(Boolean))).sort();
  const byFolder = folder ? searched.filter((n) => n.folder === folder) : searched;
  const visible = assignedToMe ? byFolder.filter((n) => n.assigned_to === username) : byFolder;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end gap-3 flex-wrap">
        <label className="flex flex-col gap-1.5 flex-1" style={{ minWidth: 200 }}>
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Search Notes</span>
          <input
            aria-label="Search Notes"
            className="text-sm px-3 py-2 rounded-lg focus:outline-none font-mono border"
            style={{ background: 'var(--paper-2)', borderColor: 'var(--rule)', color: 'var(--ink)' }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5" style={{ minWidth: 160 }}>
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Folder</span>
          <select
            aria-label="Folder"
            className="text-sm px-3 py-2 rounded-lg focus:outline-none font-mono border"
            style={{ background: 'var(--paper-2)', borderColor: 'var(--rule)', color: 'var(--ink)' }}
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
          >
            <option value="">All folders</option>
            {folders.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>
          <input
            aria-label="Assigned to me"
            type="checkbox"
            checked={assignedToMe}
            onChange={(e) => setAssignedToMe(e.target.checked)}
          />
          Assigned to me
        </label>
        <Link to="/notes/new" className="tab-sm">
          + New Note
        </Link>
      </div>
      {visible.length === 0 ? (
        <p className="text-sm px-1 py-3" style={{ color: 'var(--ink-dim)' }}>No notes.</p>
      ) : (
        <div className="specimen-grid">
          {visible.map((note) => (
            <NoteCard key={note.filename} record={note} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
