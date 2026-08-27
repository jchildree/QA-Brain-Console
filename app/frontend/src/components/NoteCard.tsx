import { Link } from 'react-router-dom';
import type { RecordSummary } from '../api/client';

export function NoteCard({
  record,
  onDelete,
}: {
  record: RecordSummary;
  onDelete: (filename: string) => void;
}) {
  const folder = typeof record.folder === 'string' ? record.folder : '';
  const rawTags = Array.isArray(record.tags) ? record.tags : [];
  const tags = rawTags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0);

  return (
    <Link to={`/notes/${record.filename}`} className="card">
      <div className="card-head">
        <span className="card-id" title={record.id}>{typeof record.title === 'string' && record.title ? record.title : record.id}</span>
        <button
          type="button"
          aria-label={`Delete ${record.id}`}
          className="card-delete-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(record.filename);
          }}
        >
          &times;
        </button>
      </div>
      <span className="card-type">{folder ? `${folder} · ${record.id}` : record.id}</span>
      {tags.length > 0 && <p className="card-desc">{tags.join(', ')}</p>}
    </Link>
  );
}
