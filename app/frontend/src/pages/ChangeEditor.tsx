import { RecordEditor } from '../components/RecordEditor';
import { RelatedRecordsGraph } from '../components/RelatedRecordsGraph';
import { createRecordApi } from '../api/client';
import { changeBlueprint } from '../blueprint/changeBlueprint';

const changeApi = createRecordApi('change');

export function ChangeEditor({ filename }: { filename: string }) {
  return <RecordEditor api={changeApi} blueprint={changeBlueprint} filename={filename} type="change" renderExtra={(fm) => <RelatedRecordsGraph record={fm} />} />;
}
