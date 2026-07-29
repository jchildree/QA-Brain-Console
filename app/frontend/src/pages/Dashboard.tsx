import { RecordDashboard } from '../components/RecordDashboard';
import { createRecordApi } from '../api/client';

const sopApi = createRecordApi('sops');

export function Dashboard() {
  return <RecordDashboard api={sopApi} title="SOP" type="sop" />;
}
