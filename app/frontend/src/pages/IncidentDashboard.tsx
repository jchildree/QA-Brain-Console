import { RecordDashboard } from '../components/RecordDashboard';
import { createRecordApi } from '../api/client';

const incidentApi = createRecordApi('incident');

export function IncidentDashboard() {
  return <RecordDashboard api={incidentApi} title="Incident" type="incident" />;
}
