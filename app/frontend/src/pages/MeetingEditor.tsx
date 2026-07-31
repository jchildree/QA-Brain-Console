import { RecordEditor } from '../components/RecordEditor';
import { createRecordApi } from '../api/client';
import { meetingBlueprint } from '../blueprint/meetingBlueprint';

const meetingApi = createRecordApi('meeting');

export function MeetingEditor({ filename }: { filename: string }) {
  return <RecordEditor api={meetingApi} blueprint={meetingBlueprint} filename={filename} type="meeting" />;
}
