import { RecordDashboard } from '../components/RecordDashboard';
import { createRecordApi } from '../api/client';

const changeApi = createRecordApi('change');

export function ChangeDashboard() {
  return <RecordDashboard api={changeApi} title="Change" type="change" />;
}
