import { useNavigate } from 'react-router-dom';
import { RecordIntake } from '../components/RecordIntake';
import { createRecordApi } from '../api/client';
import { auditBlueprint } from '../blueprint/auditBlueprint';

const auditApi = createRecordApi('audit');

export function AuditIntake() {
  const navigate = useNavigate();

  const handleSave = async (frontmatter: Record<string, unknown>, body: string) => {
    const created = await auditApi.create(frontmatter, body);
    navigate(`/audit/${created.filename}`);
  };

  return <RecordIntake api={auditApi} blueprint={auditBlueprint} onSave={handleSave} />;
}
