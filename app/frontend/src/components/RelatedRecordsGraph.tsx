import { useEffect, useRef, useState } from 'react';
import { fetchAllRecordOptions } from '../api/relatedRecords';
import { findBacklinks } from '../api/backlinks';

// Map an id prefix to its color, matching the vault's {TYPE}-{YYYYMMDD}-{seq}
// id convention. A node is colored by whatever kind of record it is.
const PREFIX_COLOR: Record<string, string> = {
  SOP: '--teal',
  INC: '--red',
  CAP: '--gold',
  CHG: '--navy-dim',
  AUD: '--navy',
  TRN: '--ink-dim',
  MTG: '--plum',
  NOTE: '--ink-dim',
};

function colorFor(id: string): string {
  return PREFIX_COLOR[id.split('-')[0]] ?? '--ink-dim';
}

function truncate(s: string, n = 24): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

const NODE_W = 190;
const NODE_H = 34;
const COL = NODE_W + 24; // horizontal spacing between nodes in a row
const LEVEL = 120; // vertical spacing between the three levels

// Directed chain, top to bottom: records that link TO this one (backlinks) sit
// in a row above, this record sits in the middle, and the documents it links to
// sit in a row below. Arrowheads point downward, so a record referenced
// elsewhere reads as part of a workflow -- the one(s) above feed into it, and it
// feeds the row beneath it.
export function RelatedRecordsGraph({ record }: { record: Record<string, unknown> }) {
  const centerId = typeof record.id === 'string' ? record.id : 'this record';
  const centerTitle = typeof record.title === 'string' && record.title.trim() ? record.title.trim() : centerId;
  const outgoing = Array.isArray(record.related_documents)
    ? (record.related_documents as unknown[]).filter((d): d is string => typeof d === 'string' && d.trim() !== '')
    : [];

  const [titles, setTitles] = useState<Record<string, string>>({});
  const [incoming, setIncoming] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    const el = panelRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  useEffect(() => {
    fetchAllRecordOptions()
      .then((opts) => setTitles(Object.fromEntries(opts.map((o) => [o.value, o.title]))))
      .catch(() => setTitles({}));
  }, []);

  useEffect(() => {
    if (centerId === 'this record') return;
    findBacklinks(centerId)
      .then((links) => setIncoming(links.map((l) => l.id)))
      .catch(() => setIncoming([]));
  }, [centerId]);

  if (outgoing.length === 0 && incoming.length === 0) {
    return (
      <div className="rounded-xl border p-6" style={{ borderColor: 'var(--rule)', background: 'var(--card)' }}>
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Linked Records</span>
        <p className="text-sm font-mono mt-2" style={{ color: 'var(--ink-dim)' }}>No linked records</p>
      </div>
    );
  }

  const widest = Math.max(incoming.length, outgoing.length, 1);
  const W = widest * COL + 40;
  const cxPos = W / 2;
  const topY = 20 + NODE_H / 2;
  const midY = topY + LEVEL;
  const botY = midY + LEVEL;
  const H = botY + NODE_H / 2 + 20;

  // Lay a set of ids out as a horizontal row, centered on the middle node.
  const row = (ids: string[], y: number) =>
    ids.map((id, i) => ({ id, x: cxPos + (i - (ids.length - 1) / 2) * COL, y }));

  const inNodes = row(incoming, topY);
  const outNodes = row(outgoing, botY);

  const nodeRect = (x: number, y: number, label: string, colorVar: string, bold = false) => (
    <g key={`${x}-${y}-${label}`}>
      <rect
        x={x - NODE_W / 2}
        y={y - NODE_H / 2}
        width={NODE_W}
        height={NODE_H}
        rx={8}
        fill="var(--card)"
        stroke={`var(${colorVar})`}
        strokeWidth={bold ? 3 : 2}
      />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={bold ? 700 : 500} fill="var(--ink)">
        {truncate(label)}
      </text>
    </g>
  );

  return (
    <div ref={panelRef} className="related-graph-panel rounded-xl border p-4" style={{ borderColor: 'var(--rule)', background: 'var(--card)' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Linked Records</span>
        <div className="flex items-center gap-1">
          <button type="button" className="graph-ctl" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.1, +(z - 0.15).toFixed(2)))}>&minus;</button>
          <button type="button" className="graph-ctl" aria-label="Reset zoom" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
          <button type="button" className="graph-ctl" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}>+</button>
          <button type="button" className="graph-ctl" aria-label="Toggle fullscreen" onClick={toggleFullscreen}>⤢</button>
        </div>
      </div>
      <div className="related-graph-viewport" style={{ marginTop: 10, overflow: 'auto', maxHeight: 300 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: `${zoom * 100}%`, minWidth: `${zoom * 100}%`, height: 'auto', display: 'block' }} role="img" aria-label="Linked records graph">
        <defs>
          <marker id="rr-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--ink-dim)" />
          </marker>
        </defs>
        {inNodes.map((n) => (
          <line
            key={`in-${n.id}`}
            x1={n.x}
            y1={n.y + NODE_H / 2}
            x2={cxPos}
            y2={midY - NODE_H / 2 - 8}
            stroke="var(--ink-dim)"
            strokeWidth={1.5}
            markerEnd="url(#rr-arrow)"
          />
        ))}
        {outNodes.map((n) => (
          <line
            key={`out-${n.id}`}
            x1={cxPos}
            y1={midY + NODE_H / 2}
            x2={n.x}
            y2={n.y - NODE_H / 2 - 8}
            stroke="var(--ink-dim)"
            strokeWidth={1.5}
            markerEnd="url(#rr-arrow)"
          />
        ))}
        {inNodes.map((n) => nodeRect(n.x, n.y, titles[n.id] ?? n.id, colorFor(n.id)))}
        {outNodes.map((n) => nodeRect(n.x, n.y, titles[n.id] ?? n.id, colorFor(n.id)))}
        {nodeRect(cxPos, midY, centerTitle, colorFor(centerId), true)}
        </svg>
      </div>
    </div>
  );
}
