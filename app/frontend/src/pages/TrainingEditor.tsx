import { RecordEditor } from '../components/RecordEditor';
import { createRecordApi } from '../api/client';
import { trainingBlueprint } from '../blueprint/trainingBlueprint';

const trainingApi = createRecordApi('training');

export function TrainingEditor({ filename }: { filename: string }) {
  return <RecordEditor api={trainingApi} blueprint={trainingBlueprint} filename={filename} />;
}
