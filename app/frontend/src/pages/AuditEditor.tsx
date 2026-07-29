import { RecordEditor } from '../components/RecordEditor';
import { createRecordApi } from '../api/client';
import { auditBlueprint } from '../blueprint/auditBlueprint';

const auditApi = createRecordApi('audit');

export function AuditEditor({ filename }: { filename: string }) {
  return <RecordEditor api={auditApi} blueprint={auditBlueprint} filename={filename} type="audit" />;
}
