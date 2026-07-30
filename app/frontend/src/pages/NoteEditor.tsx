import { useNavigate } from 'react-router-dom';
import { RecordEditor } from '../components/RecordEditor';
import { createRecordApi } from '../api/client';
import { notesBlueprint, notesBlueprintAdmin } from '../blueprint/notesBlueprint';
import { useAuth } from '../context/AuthContext';

const notesApi = createRecordApi('notes');

const PROMOTE_TARGETS = [
  { type: 'sop', label: 'SOP' },
  { type: 'cap', label: 'CAP' },
  { type: 'incident', label: 'Incident' },
  { type: 'change', label: 'Change' },
  { type: 'audit', label: 'Audit' },
  { type: 'training', label: 'Training' },
];

export function NoteEditor({ filename }: { filename: string }) {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  return (
    <RecordEditor
      api={notesApi}
      blueprint={isAdmin ? notesBlueprintAdmin : notesBlueprint}
      filename={filename}
      type="notes"
      renderExtraActions={(frontmatter, body) => (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>
            Promote to
          </span>
          {PROMOTE_TARGETS.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              className="accession-btn"
              onClick={() => navigate(`/${type}/new`, { state: { rawText: body, title: frontmatter.title } })}
            >
              {label}
            </button>
          ))}
          {!isAdmin && typeof frontmatter.assigned_to === 'string' && frontmatter.assigned_to && (
            <span className="text-xs font-mono" style={{ color: 'var(--ink-dim)' }}>
              Assigned to: {frontmatter.assigned_to}
            </span>
          )}
        </div>
      )}
    />
  );
}
