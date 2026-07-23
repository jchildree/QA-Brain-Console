import { useNavigate } from 'react-router-dom';
import { RecordIntake } from '../components/RecordIntake';
import { createRecordApi } from '../api/client';
import { incidentBlueprint } from '../blueprint/incidentBlueprint';

const incidentApi = createRecordApi('incident');

export function IncidentIntake() {
  const navigate = useNavigate();

  const handleSave = async (frontmatter: Record<string, unknown>, body: string) => {
    const created = await incidentApi.create(frontmatter, body);
    navigate(`/incident/${created.filename}`);
  };

  return <RecordIntake api={incidentApi} blueprint={incidentBlueprint} onSave={handleSave} />;
}
