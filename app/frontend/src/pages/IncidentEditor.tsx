import { RecordEditor } from '../components/RecordEditor';
import { createRecordApi } from '../api/client';
import { incidentBlueprint } from '../blueprint/incidentBlueprint';

const incidentApi = createRecordApi('incident');

export function IncidentEditor({ filename }: { filename: string }) {
  return <RecordEditor api={incidentApi} blueprint={incidentBlueprint} filename={filename} />;
}
