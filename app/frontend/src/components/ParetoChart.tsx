export interface ParetoDatum {
  label: string;
  value: number;
}

const W = 1600;
const H = 380;
const PAD_L = 40;
const PAD_R = 40;
const PAD_T = 20;
const PAD_B = 90;

// Sorted bars (descending) plus a cumulative-% line -- the classic Pareto.
// Hand-rolled SVG so it inherits the vault's CSS custom-property colors.
export function ParetoChart({
  title,
  data,
  barColorVar = '--gold',
}: {
  title: string;
  data: ParetoDatum[];
  barColorVar?: string;
}) {
  const sorted = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, d) => sum + d.value, 0);

  if (sorted.length === 0) {
    return (
      <div className="chart-panel">
        <div className="chart-head">
          <span className="chart-title">{title}</span>
        </div>
        <p className="text-sm px-1 py-3" style={{ color: 'var(--ink-dim)' }}>No data yet.</p>
      </div>
    );
  }

  const maxVal = Math.max(...sorted.map((d) => d.value));
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const bandW = plotW / sorted.length;
  const barW = bandW * 0.6;

  const yBar = (v: number) => PAD_T + plotH - (v / maxVal) * plotH;
  const yPct = (p: number) => PAD_T + plotH - p * plotH;

  let cum = 0;
  const linePts = sorted.map((d, i) => {
    cum += d.value;
    const x = PAD_L + bandW * i + bandW / 2;
    return { x, y: yPct(cum / total), pct: cum / total };
  });
  const linePath = linePts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="chart-panel">
      <div className="chart-head">
        <span className="chart-title">{title}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: 380, display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1={PAD_L} y1={yPct(g)} x2={W - PAD_R} y2={yPct(g)} stroke="var(--rule)" strokeWidth={1} />
        ))}
        {sorted.map((d, i) => {
          const x = PAD_L + bandW * i + (bandW - barW) / 2;
          const y = yBar(d.value);
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barW} height={PAD_T + plotH - y} fill={`var(${barColorVar})`} opacity={0.85} />
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize={20} fill="var(--ink)">{d.value}</text>
              <text
                x={PAD_L + bandW * i + bandW / 2}
                y={H - PAD_B + 26}
                textAnchor="end"
                fontSize={18}
                fill="var(--ink-dim)"
                transform={`rotate(-30 ${PAD_L + bandW * i + bandW / 2} ${H - PAD_B + 26})`}
              >
                {d.label}
              </text>
            </g>
          );
        })}
        <path d={linePath} fill="none" stroke="var(--teal)" strokeWidth={2.5} />
        {linePts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--teal)" />
        ))}
      </svg>
    </div>
  );
}
