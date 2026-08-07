import { ReactFlow, Background, Controls, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export interface VaultNode {
  id: string;
  colorVar: string;
  related_documents?: unknown;
}

// Global force-ish graph: every record (all 7 types + notes) as a node,
// arranged on a ring, with edges drawn from related_documents to any target
// that also exists as a node. Orphans (no edge in or out) render dimmed so the
// connected structure stands out. Layout is a simple circle -- react-flow's
// fitView + pan/zoom carries the rest at higher node counts.
export function VaultGraph({ records }: { records: VaultNode[] }) {
  const ids = new Set(records.map((r) => r.id));

  const edges: Edge[] = [];
  const connected = new Set<string>();
  for (const r of records) {
    const related = Array.isArray(r.related_documents) ? (r.related_documents as unknown[]) : [];
    for (const target of related) {
      if (typeof target !== 'string' || !ids.has(target)) continue;
      edges.push({ id: `${r.id}->${target}`, source: r.id, target, style: { stroke: 'var(--rule)' } });
      connected.add(r.id);
      connected.add(target);
    }
  }

  const n = Math.max(1, records.length);
  const radius = 60 + n * 22;
  const nodes: Node[] = records.map((r, i) => {
    const angle = (i / n) * 2 * Math.PI;
    const isOrphan = !connected.has(r.id);
    return {
      id: r.id,
      position: { x: radius * Math.cos(angle), y: radius * Math.sin(angle) },
      data: { label: r.id },
      draggable: true,
      style: {
        background: 'var(--card)',
        border: `2px solid var(${r.colorVar})`,
        borderRadius: 8,
        padding: '4px 8px',
        fontSize: 11,
        fontFamily: 'monospace',
        color: 'var(--ink)',
        opacity: isOrphan ? 0.35 : 1,
      },
    };
  });

  if (records.length === 0) {
    return <p className="text-sm font-mono" style={{ color: 'var(--ink-dim)' }}>No records to graph yet.</p>;
  }

  return (
    <div style={{ height: 520 }}>
      <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.1} proOptions={{ hideAttribution: true }}>
        <Background color="var(--rule)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
