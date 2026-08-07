export interface DonutDatum {
  label: string;
  value: number;
  colorVar: string;
}

const SIZE = 120;
const R = 48;
const STROKE = 16;
const C = 2 * Math.PI * R;

// Hand-rolled SVG donut, matching StripChart's CSS-custom-property color scheme
// (arcs stroked with var(--...)). One ring, arcs sized by share of total.
export function DonutChart({ title, data }: { title: string; data: DonutDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  let offset = 0;
  const arcs = total === 0
    ? []
    : data
        .filter((d) => d.value > 0)
        .map((d) => {
          const frac = d.value / total;
          const arc = {
            colorVar: d.colorVar,
            dash: frac * C,
            gap: C - frac * C,
            rotation: (offset / total) * 360 - 90,
          };
          offset += d.value;
          return arc;
        });

  return (
    <div className="donut">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} role="img" aria-label={`${title}: ${total} total`}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--rule)" strokeWidth={STROKE} opacity={0.35} />
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={`var(${a.colorVar})`}
            strokeWidth={STROKE}
            strokeDasharray={`${a.dash.toFixed(2)} ${a.gap.toFixed(2)}`}
            transform={`rotate(${a.rotation.toFixed(2)} ${SIZE / 2} ${SIZE / 2})`}
          />
        ))}
        <text x={SIZE / 2} y={SIZE / 2} textAnchor="middle" dominantBaseline="central" fontSize="22" fontWeight="700" fill="var(--ink)">
          {total}
        </text>
      </svg>
      <div className="donut-title">{title}</div>
    </div>
  );
}
