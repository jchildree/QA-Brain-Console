export interface FunnelStage {
  label: string;
  value: number;
  colorVar: string;
}

// Horizontal-bar funnel: one row per stage, bar width proportional to the
// largest stage's count. Hand-rolled to match the CSS-custom-property color
// scheme used by StripChart/DonutChart.
export function FunnelChart({ title, stages }: { title: string; stages: FunnelStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.value));

  return (
    <div className="chart-panel">
      <div className="chart-head">
        <span className="chart-title">{title}</span>
      </div>
      <div className="funnel">
        {stages.map((s) => (
          <div className="funnel-row" key={s.label}>
            <span className="funnel-label">{s.label}</span>
            <div className="funnel-track">
              <div
                className="funnel-bar"
                style={{ width: `${(s.value / max) * 100}%`, background: `var(${s.colorVar})` }}
              />
            </div>
            <span className="funnel-value">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
