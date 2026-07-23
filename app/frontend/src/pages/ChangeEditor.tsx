import { RecordEditor } from '../components/RecordEditor';
import { createRecordApi } from '../api/client';
import { changeBlueprint } from '../blueprint/changeBlueprint';

const changeApi = createRecordApi('change');

export function ChangeEditor({ filename }: { filename: string }) {
  return <RecordEditor api={changeApi} blueprint={changeBlueprint} filename={filename} />;
}
