import { RecordDashboard } from '../components/RecordDashboard';
import { createRecordApi } from '../api/client';

const trainingApi = createRecordApi('training');

export function TrainingDashboard() {
  return <RecordDashboard api={trainingApi} title="Training" type="training" />;
}
