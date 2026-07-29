import { useEffect, useRef } from 'react';

export interface ChartSeries {
  label: string;
  colorVar: string;
  data: number[];
}

export interface ChartReadout {
  label: string;
  value: string;
  direction: 'up' | 'down' | 'flat';
}

const W = 1600;
const H = 320;
const PAD = 14;

function xFor(i: number, n: number): number {
  return PAD + (i / (n - 1)) * (W - PAD * 2);
}

function yFor(v: number, maxVal: number): number {
  return H - PAD - (v / maxVal) * (H - PAD * 2);
}

export function StripChart({
  title,
  quip,
  series,
  readouts,
}: {
  title: string;
  quip: string;
  series: ChartSeries[];
  readouts: ChartReadout[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const styles = getComputedStyle(document.documentElement);
    const col = (name: string) => styles.getPropertyValue(name).trim();
    const reduceMotion =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const maxVal = Math.max(6, ...series.flatMap((s) => s.data)) || 6;

    let svgHtml = '';
    for (let g = 0; g <= maxVal; g += Math.max(1, Math.round(maxVal / 3))) {
      const y = yFor(g, maxVal);
      svgHtml += `<line x1="${PAD}" y1="${y}" x2="${W - PAD}" y2="${y}" stroke="${col('--rule')}" stroke-width="1"/>`;
    }

    series.forEach((s, si) => {
      const n = s.data.length;
      if (n < 2) return;
      const pts = s.data.map((v, i) => [xFor(i, n), yFor(v, maxVal)]);
      const linePath = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
      const areaPath = linePath + ` L${pts[pts.length - 1][0].toFixed(1)},${H - PAD} L${pts[0][0].toFixed(1)},${H - PAD} Z`;
      const color = col(s.colorVar);
      const last = pts[pts.length - 1];
      svgHtml += `<path d="${areaPath}" fill="${color}" opacity="0.08"/>`;
      svgHtml += `<path class="trace-line" data-idx="${si}" d="${linePath}" fill="none" stroke="${color}" stroke-width="2.25" stroke-linecap="round"/>`;
      svgHtml += `<circle class="trace-dot" data-idx="${si}" cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="4" fill="${color}"/>`;
      svgHtml += `<circle class="trace-pulse" data-idx="${si}" cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="7" fill="${color}" opacity="0.28"/>`;
    });
    svg.innerHTML = svgHtml;

    if (!reduceMotion && typeof SVGPathElement !== 'undefined' && 'getTotalLength' in SVGPathElement.prototype) {
      svg.querySelectorAll<SVGPathElement>('.trace-line').forEach((path, i) => {
        const len = path.getTotalLength();
        path.style.strokeDasharray = String(len);
        path.style.strokeDashoffset = String(len);
        path.getBoundingClientRect();
        path.style.transition = `stroke-dashoffset 1.1s ease-out ${i * 0.12}s`;
        requestAnimationFrame(() => {
          path.style.strokeDashoffset = '0';
        });
      });
      svg.querySelectorAll<SVGCircleElement>('.trace-pulse').forEach((el, i) => {
        el.animate?.(
          [
            { r: 7, opacity: 0.28 },
            { r: 12, opacity: 0 },
            { r: 7, opacity: 0.28 },
          ],
          { duration: 2200, iterations: Infinity, delay: i * 180, easing: 'ease-in-out' }
        );
      });
    }
  }, [series]);

  return (
    <div className="chart-panel">
      <div className="chart-head">
        <span className="chart-title">{title}</span>
        <span className="chart-quip">{quip}</span>
        <div className="chart-legend">
          {series.map((s) => (
            <span key={s.label}>
              <i className="swatch" style={{ background: `var(${s.colorVar})` }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      <svg id="chart" ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" />
      <div className="chart-readout">
        {readouts.map((r) => (
          <div key={r.label}>
            <span className="r-label">{r.label}</span>
            <span className={`r-value r-${r.direction}`}>
              {r.value} {r.direction === 'up' ? '▲' : r.direction === 'down' ? '▼' : '▬'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
