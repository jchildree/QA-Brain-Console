import { useNavigate } from 'react-router-dom';
import { RecordIntake } from '../components/RecordIntake';
import { createRecordApi } from '../api/client';
import { changeBlueprint } from '../blueprint/changeBlueprint';

const changeApi = createRecordApi('change');

export function ChangeIntake() {
  const navigate = useNavigate();

  const handleSave = async (frontmatter: Record<string, unknown>, body: string) => {
    const created = await changeApi.create(frontmatter, body);
    navigate(`/change/${created.filename}`);
  };

  return <RecordIntake api={changeApi} blueprint={changeBlueprint} onSave={handleSave} />;
}
