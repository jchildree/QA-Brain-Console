import { useNavigate, useLocation } from 'react-router-dom';
import { RecordIntake } from '../components/RecordIntake';
import { createRecordApi } from '../api/client';
import { sopBlueprint } from '../blueprint/sopBlueprint';

const sopApi = createRecordApi('sops');

export function Intake() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSave = async (frontmatter: Record<string, unknown>, body: string) => {
    const created = await sopApi.create(frontmatter, body);
    navigate(`/sop/${created.filename}`);
  };

  return (
    <RecordIntake
      api={sopApi}
      blueprint={sopBlueprint}
      onSave={handleSave}
      initialRawText={(location.state as { rawText?: string; title?: string } | null)?.rawText}
      initialTitle={(location.state as { rawText?: string; title?: string } | null)?.title}
    />
  );
}
