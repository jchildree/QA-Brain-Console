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
  const tags = Array.isArray(record.tags) ? (record.tags as string[]) : [];

  return (
    <Link to={`/notes/${record.filename}`} className="card">
      <div className="card-head">
        <span className="card-id">{typeof record.title === 'string' && record.title ? record.title : record.id}</span>
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
      {folder && <span className="card-type">{folder}</span>}
      {tags.length > 0 && <p className="card-desc">{tags.join(', ')}</p>}
    </Link>
  );
}
