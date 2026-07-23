import { useNavigate } from 'react-router-dom';
import { RecordIntake } from '../components/RecordIntake';
import { createRecordApi } from '../api/client';
import { capBlueprint } from '../blueprint/capBlueprint';

const capApi = createRecordApi('cap');

export function CapIntake() {
  const navigate = useNavigate();

  const handleSave = async (frontmatter: Record<string, unknown>, body: string) => {
    const created = await capApi.create(frontmatter, body);
    navigate(`/cap/${created.filename}`);
  };

  return <RecordIntake api={capApi} blueprint={capBlueprint} onSave={handleSave} />;
}
