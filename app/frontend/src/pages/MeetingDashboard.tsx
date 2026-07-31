import { RecordDashboard } from '../components/RecordDashboard';
import { createRecordApi } from '../api/client';

const meetingApi = createRecordApi('meeting');

export function MeetingDashboard() {
  return <RecordDashboard api={meetingApi} title="Meeting Minute" type="meeting" />;
}
