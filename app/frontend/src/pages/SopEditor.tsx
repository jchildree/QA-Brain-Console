import { RecordEditor } from '../components/RecordEditor';
import { createRecordApi } from '../api/client';
import { sopBlueprint } from '../blueprint/sopBlueprint';

const sopApi = createRecordApi('sops');

export function SopEditor({ filename }: { filename: string }) {
  return <RecordEditor api={sopApi} blueprint={sopBlueprint} filename={filename} type="sop" />;
}
