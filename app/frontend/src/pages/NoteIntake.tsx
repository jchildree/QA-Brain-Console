import { useNavigate, useLocation } from 'react-router-dom';
import { RecordIntake } from '../components/RecordIntake';
import { createRecordApi } from '../api/client';
import { notesBlueprint, notesBlueprintAdmin } from '../blueprint/notesBlueprint';
import { useAuth } from '../context/AuthContext';

const notesApi = createRecordApi('notes');

export function NoteIntake() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const navState = location.state as { rawText?: string; folder?: string; title?: string } | null;

  const blueprint = isAdmin ? notesBlueprintAdmin : notesBlueprint;

  // Notes have their own small controlled vocabulary -- AI extraction (which
  // falls back to broader record fields) must not smuggle status/version/etc.
  // onto a note, so keep only the blueprint's fields plus folder.
  const allowedKeys = new Set([...blueprint.map((f) => f.key), 'folder']);

  const handleSave = async (frontmatter: Record<string, unknown>, body: string) => {
    const clean = Object.fromEntries(Object.entries(frontmatter).filter(([k]) => allowedKeys.has(k)));
    const created = await notesApi.create(clean, body);
    navigate(`/notes/${created.filename}`);
  };

  return (
    <RecordIntake
      api={notesApi}
      blueprint={blueprint}
      onSave={handleSave}
      initialRawText={navState?.rawText}
      initialTitle={navState?.title}
      initialFields={navState?.folder ? { folder: navState.folder } : {}}
    />
  );
}
