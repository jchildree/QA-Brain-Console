import { RecordDashboard } from '../components/RecordDashboard';
import { createRecordApi } from '../api/client';

const capApi = createRecordApi('cap');

export function CapDashboard() {
  return <RecordDashboard api={capApi} title="CAP" />;
}
