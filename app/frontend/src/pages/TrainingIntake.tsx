import { useNavigate, useLocation } from 'react-router-dom';
import { RecordIntake } from '../components/RecordIntake';
import { createRecordApi } from '../api/client';
import { trainingBlueprint } from '../blueprint/trainingBlueprint';

const trainingApi = createRecordApi('training');

export function TrainingIntake() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSave = async (frontmatter: Record<string, unknown>, body: string) => {
    const created = await trainingApi.create(frontmatter, body);
    navigate(`/training/${created.filename}`);
  };

  return (
    <RecordIntake
      api={trainingApi}
      blueprint={trainingBlueprint}
      onSave={handleSave}
      initialRawText={(location.state as { rawText?: string } | null)?.rawText}
    />
  );
}
