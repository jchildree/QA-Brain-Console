import { RecordDashboard } from '../components/RecordDashboard';
import { createRecordApi } from '../api/client';

const auditApi = createRecordApi('audit');

export function AuditDashboard() {
  return <RecordDashboard api={auditApi} title="Audit" />;
}
