import { RecordEditor } from '../components/RecordEditor';
import { RelatedRecordsGraph } from '../components/RelatedRecordsGraph';
import { createRecordApi } from '../api/client';
import { trainingBlueprint } from '../blueprint/trainingBlueprint';

const trainingApi = createRecordApi('training');

export function TrainingEditor({ filename }: { filename: string }) {
  return <RecordEditor api={trainingApi} blueprint={trainingBlueprint} filename={filename} type="training" renderExtra={(fm) => <RelatedRecordsGraph record={fm} />} />;
}
