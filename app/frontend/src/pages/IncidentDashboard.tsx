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
        <>
          <ParetoChart title="Root Cause Pareto" data={paretoCounts(records, 'root_cause')} barColorVar="--red" />
          <ParetoChart title="Severity Distribution" data={paretoCounts(records, 'severity')} barColorVar="--gold" />
          <StripChart
            title="Severity Mix, 14-Day Trace"
            quip="how the severity profile builds over time"
            series={dailySeverityTrend(records)}
            readouts={[]}
          />
        </>
      )}
    />
  );
}
