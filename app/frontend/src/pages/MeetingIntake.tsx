import { useNavigate, useLocation } from 'react-router-dom';
import { RecordIntake } from '../components/RecordIntake';
import { createRecordApi } from '../api/client';
import { meetingBlueprint } from '../blueprint/meetingBlueprint';

const meetingApi = createRecordApi('meeting');

export function MeetingIntake() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSave = async (frontmatter: Record<string, unknown>, body: string) => {
    const created = await meetingApi.create(frontmatter, body);
    navigate(`/meeting/${created.filename}`);
  };

  return (
    <RecordIntake
      api={meetingApi}
      blueprint={meetingBlueprint}
      onSave={handleSave}
      initialRawText={(location.state as { rawText?: string; title?: string } | null)?.rawText}
      initialTitle={(location.state as { rawText?: string; title?: string } | null)?.title}
    />
  );
}
