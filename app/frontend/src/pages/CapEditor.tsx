import { RecordEditor } from '../components/RecordEditor';
import { createRecordApi } from '../api/client';
import { capBlueprint } from '../blueprint/capBlueprint';

const capApi = createRecordApi('cap');

export function CapEditor({ filename }: { filename: string }) {
  return <RecordEditor api={capApi} blueprint={capBlueprint} filename={filename} type="cap" />;
}
