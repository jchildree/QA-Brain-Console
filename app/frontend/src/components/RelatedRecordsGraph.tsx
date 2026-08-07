import { ReactFlow, Background, Controls, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Map an id prefix to its record type + color, so a neighbor node is colored
// by whatever kind of record it links to. Prefixes match the vault's
// {TYPE}-{YYYYMMDD}-{seq} id convention.
const PREFIX_META: Record<string, { type: string; colorVar: string }> = {
  SOP: { type: 'sop', colorVar: '--teal' },
  INC: { type: 'incident', colorVar: '--red' },
  CAP: { type: 'cap', colorVar: '--gold' },
  CHG: { type: 'change', colorVar: '--navy-dim' },
  AUD: { type: 'audit', colorVar: '--navy' },
  TRN: { type: 'training', colorVar: '--ink-dim' },
  MTG: { type: 'meeting', colorVar: '--plum' },
  NOTE: { type: 'notes', colorVar: '--ink-dim' },
};

function metaFor(id: string) {
  const prefix = id.split('-')[0];
  return PREFIX_META[prefix] ?? { type: 'unknown', colorVar: '--ink-dim' };
}

function nodeStyle(colorVar: string): React.CSSProperties {
  return {
    background: 'var(--card)',
    border: `2px solid var(${colorVar})`,
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 12,
    fontFamily: 'monospace',
    color: 'var(--ink)',
  };
}

export function RelatedRecordsGraph({ record }: { record: Record<string, unknown> }) {
  const centerId = typeof record.id === 'string' ? record.id : 'this record';
  const related = Array.isArray(record.related_documents)
    ? (record.related_documents as unknown[]).filter((d): d is string => typeof d === 'string' && d.trim() !== '')
    : [];

  if (related.length === 0) {
    return (
      <div className="rounded-xl border p-6" style={{ borderColor: 'var(--rule)', background: 'var(--card)' }}>
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Linked Records</span>
        <p className="text-sm font-mono mt-2" style={{ color: 'var(--ink-dim)' }}>No linked records</p>
      </div>
    );
  }

  const cx = 300;
  const cy = 40 + Math.max(1, related.length) * 30;
  const radius = 160;

  const nodes: Node[] = [
    {
      id: centerId,
      position: { x: cx, y: cy },
      data: { label: centerId },
      style: { ...nodeStyle(metaFor(centerId).colorVar), fontWeight: 700 },
      draggable: true,
    },
    ...related.map((id, i) => {
      const angle = (i / related.length) * 2 * Math.PI - Math.PI / 2;
      return {
        id,
        position: { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) },
        data: { label: id },
        style: nodeStyle(metaFor(id).colorVar),
        draggable: true,
      } satisfies Node;
    }),
  ];

  const edges: Edge[] = related.map((id) => ({
    id: `${centerId}->${id}`,
    source: centerId,
    target: id,
    style: { stroke: `var(${metaFor(id).colorVar})` },
  }));

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--rule)', background: 'var(--card)' }}>
      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>Linked Records</span>
      <div style={{ height: 320, marginTop: 10 }}>
        <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
          <Background color="var(--rule)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
}
