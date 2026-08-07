import { RecordDashboard } from '../components/RecordDashboard';
import { FunnelChart } from '../components/FunnelChart';
import { createRecordApi } from '../api/client';
import { effectivenessFunnel } from '../api/chartData';

const capApi = createRecordApi('cap');

export function CapDashboard() {
  return (
    <RecordDashboard
      api={capApi}
      title="CAP"
      type="cap"
      renderExtraCharts={(records) => (
        <FunnelChart title="CAP Effectiveness Funnel" stages={effectivenessFunnel(records)} />
      )}
    />
  );
}
