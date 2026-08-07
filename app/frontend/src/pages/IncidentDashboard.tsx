import { RecordDashboard } from '../components/RecordDashboard';
import { ParetoChart } from '../components/ParetoChart';
import { StripChart } from '../components/StripChart';
import { createRecordApi } from '../api/client';
import { paretoCounts, dailySeverityTrend } from '../api/chartData';

const incidentApi = createRecordApi('incident');

export function IncidentDashboard() {
  return (
    <RecordDashboard
      api={incidentApi}
      title="Incident"
      type="incident"
      renderExtraCharts={(records) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, alignItems: 'stretch' }}>
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <ParetoChart title="Root Cause Pareto" data={paretoCounts(records, 'root_cause')} barColorVar="--red" />
          </div>
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <ParetoChart title="Severity Distribution" data={paretoCounts(records, 'severity')} barColorVar="--gold" />
          </div>
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <StripChart
              title="Severity Mix, 14-Day Trace"
              quip="how the severity profile builds over time"
              series={dailySeverityTrend(records)}
              readouts={[]}
            />
          </div>
        </div>
      )}
    />
  );
}
