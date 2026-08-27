import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RelatedRecordsGraph } from './RelatedRecordsGraph';
import * as relatedRecords from '../api/relatedRecords';
import * as backlinksApi from '../api/backlinks';

function makeFakeRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { id: 'CAP-1', title: 'Test Record', related_documents: [], ...overrides };
}

const ALL_TITLES: relatedRecords.RecordOption[] = [
  { value: 'SOP-1', title: 'Standard Operating Procedure 1', label: 'SOP: Standard Operating Procedure 1' },
  { value: 'INC-2', title: 'Incident 2', label: 'INCIDENT: Incident 2' },
  { value: 'CAP-3', title: 'Cap 3', label: 'CAP: Cap 3' },
  { value: 'CHG-4', title: 'Change 4', label: 'CHANGE: Change 4' },
  { value: 'AUD-5', title: 'Audit 5', label: 'AUDIT: Audit 5' },
  { value: 'TRN-6', title: 'Training 6', label: 'TRAINING: Training 6' },
  { value: 'MTG-7', title: 'Meeting 7', label: 'MEETING: Meeting 7' },
  { value: 'NOTE-8', title: 'Note 8', label: 'NOTE: Note 8' },
];

function mockFetchAllRecordOptions(opts: relatedRecords.RecordOption[] = ALL_TITLES) {
  vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockResolvedValue(opts);
}

function mockFindBacklinks(links: backlinksApi.Backlink[] = []) {
  vi.spyOn(backlinksApi, 'findBacklinks').mockResolvedValue(links);
}

beforeEach(() => {
  vi.restoreAllMocks();
  mockFetchAllRecordOptions([]);
  mockFindBacklinks([]);
});

describe('RelatedRecordsGraph - empty state', () => {
  it('shows "No linked records" and no SVG when there are no incoming or outgoing links', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: [] })} />);
    await waitFor(() => expect(screen.getByText('No linked records')).toBeInTheDocument());
    expect(screen.queryByRole('img', { name: 'Linked records graph' })).not.toBeInTheDocument();
  });

  it('treats a missing related_documents field as empty', async () => {
    render(<RelatedRecordsGraph record={{ id: 'CAP-1', title: 'Test' }} />);
    await waitFor(() => expect(screen.getByText('No linked records')).toBeInTheDocument());
  });
});

describe('RelatedRecordsGraph - graph rendering with data', () => {
  it('renders center + 1 outgoing node with a bold center and downward arrow', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['SOP-1'] })} />);
    const svg = await screen.findByRole('img', { name: 'Linked records graph' });
    const rects = svg.querySelectorAll('rect');
    expect(rects.length).toBe(2);
    const strokeWidths = Array.from(rects).map((r) => r.getAttribute('stroke-width'));
    expect(strokeWidths).toContain('3');
    expect(strokeWidths.filter((w) => w === '2').length).toBe(1);
    const line = svg.querySelector('line');
    expect(line).toBeTruthy();
    expect(Number(line!.getAttribute('y2'))).toBeGreaterThan(Number(line!.getAttribute('y1')));
  });

  it('renders 2 incoming + center with arrows pointing down into center', async () => {
    mockFindBacklinks([
      { type: 'sop', id: 'SOP-1', filename: 'SOP-1.md' },
      { type: 'inc', id: 'INC-2', filename: 'INC-2.md' },
    ]);
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: [] })} />);
    const svg = await screen.findByRole('img', { name: 'Linked records graph' });
    expect(svg.querySelectorAll('rect').length).toBe(3);
    svg.querySelectorAll('line').forEach((line) => {
      expect(Number(line.getAttribute('y2'))).toBeGreaterThan(Number(line.getAttribute('y1')));
    });
  });

  it('renders all 7 nodes for a balanced 3-in/3-out graph', async () => {
    mockFindBacklinks([
      { type: 'sop', id: 'SOP-1', filename: 'SOP-1.md' },
      { type: 'inc', id: 'INC-2', filename: 'INC-2.md' },
      { type: 'cap', id: 'CAP-3', filename: 'CAP-3.md' },
    ]);
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['CHG-4', 'AUD-5', 'TRN-6'] })} />);
    const svg = await screen.findByRole('img', { name: 'Linked records graph' });
    expect(svg.querySelectorAll('rect').length).toBe(7);
    // widest row is 3 -> W = 3 * COL(214) + 40
    const viewBox = svg.getAttribute('viewBox')!.split(' ').map(Number);
    expect(viewBox[2]).toBe(3 * 214 + 40);
  });
});

describe('RelatedRecordsGraph - partial title map', () => {
  it('shows the fetched title for a known id and falls back to the id for an unknown one', async () => {
    mockFetchAllRecordOptions([{ value: 'SOP-1', title: 'Standard Operating Procedure 1', label: 'SOP: Standard Operating Procedure 1' }]);
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['SOP-1', 'UNKNOWN-ID'] })} />);
    await screen.findByRole('img', { name: 'Linked records graph' });
    expect(await screen.findByText('Standard Operating Proc…')).toBeInTheDocument();
    expect(screen.getByText('UNKNOWN-ID')).toBeInTheDocument();
  });
});

describe('RelatedRecordsGraph - invalid / malformed data', () => {
  it('skips findBacklinks() when centerId is the "this record" placeholder', async () => {
    const spy = vi.spyOn(backlinksApi, 'findBacklinks');
    render(<RelatedRecordsGraph record={makeFakeRecord({ id: undefined, related_documents: ['SOP-1'] })} />);
    await screen.findByRole('img', { name: 'Linked records graph' });
    expect(spy).not.toHaveBeenCalled();
  });

  it.each([null, undefined, 42])('falls back centerId to "this record" when id is %p', async (badId) => {
    const spy = vi.spyOn(backlinksApi, 'findBacklinks');
    render(<RelatedRecordsGraph record={makeFakeRecord({ id: badId, related_documents: ['SOP-1'] })} />);
    await screen.findByRole('img', { name: 'Linked records graph' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('filters related_documents to only non-empty strings', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['SOP-1', 123, null, 'CAP-1'] })} />);
    const svg = await screen.findByRole('img', { name: 'Linked records graph' });
    // center + SOP-1 + CAP-1 = 3 nodes; 123/null dropped
    expect(svg.querySelectorAll('rect').length).toBe(3);
  });

  it('filters out empty and whitespace-only strings', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['SOP-1', '', '   '] })} />);
    const svg = await screen.findByRole('img', { name: 'Linked records graph' });
    expect(svg.querySelectorAll('rect').length).toBe(2);
  });
});

describe('RelatedRecordsGraph - duplicate ids', () => {
  it('renders a duplicated outgoing id only once', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['SOP-1', 'SOP-1', 'CAP-1'] })} />);
    const svg = await screen.findByRole('img', { name: 'Linked records graph' });
    // center + SOP-1 + CAP-1 = 3 nodes, not 4
    expect(svg.querySelectorAll('rect').length).toBe(3);
    expect(screen.getAllByText('SOP-1')).toHaveLength(1);
  });

  it('sizes the graph width off the deduplicated outgoing count', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['SOP-1', 'SOP-1', 'SOP-1'] })} />);
    const svg = await screen.findByRole('img', { name: 'Linked records graph' });
    const viewBox = svg.getAttribute('viewBox')!.split(' ').map(Number);
    // widest row is 1 (deduplicated), not 3
    expect(viewBox[2]).toBe(1 * 214 + 40);
  });
});

describe('RelatedRecordsGraph - API failure recovery', () => {
  it('falls back all titles to ids when fetchAllRecordOptions rejects', async () => {
    vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockRejectedValue(new Error('network error'));
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['SOP-1'] })} />);
    await screen.findByRole('img', { name: 'Linked records graph' });
    expect(await screen.findByText('SOP-1')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders with no incoming nodes when findBacklinks rejects', async () => {
    vi.spyOn(backlinksApi, 'findBacklinks').mockRejectedValue(new Error('backlinks unreachable'));
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['SOP-1'] })} />);
    const svg = await screen.findByRole('img', { name: 'Linked records graph' });
    expect(svg.querySelectorAll('rect').length).toBe(2); // center + SOP-1 only
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('RelatedRecordsGraph - SVG math & layout', () => {
  it('sizes width for 5 outgoing nodes and only reserves the outgoing level', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['A-1', 'B-2', 'C-3', 'D-4', 'E-5'] })} />);
    const svg = await screen.findByRole('img', { name: 'Linked records graph' });
    const viewBox = svg.getAttribute('viewBox')!.split(' ').map(Number);
    expect(viewBox[2]).toBe(5 * 214 + 40);
    // no incoming -> center sits at topY, only one LEVEL (120) reserved below it
    // H = botY + 17 + 20 = (topY + 120) + 37 = (37 + 120) + 37 = 194
    expect(viewBox[3]).toBe(194);
  });

  it('does not render an SVG once the empty-state guard fires', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: [] })} />);
    await waitFor(() => expect(screen.getByText('No linked records')).toBeInTheDocument());
    expect(screen.queryByRole('img', { name: 'Linked records graph' })).not.toBeInTheDocument();
  });

  it('renders 10 nodes in a scrollable viewport without crashing', async () => {
    const ids = Array.from({ length: 10 }, (_, i) => `SOP-${i}`);
    const { container } = render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ids })} />);
    const svg = await screen.findByRole('img', { name: 'Linked records graph' });
    expect(svg.querySelectorAll('rect').length).toBe(11);
    const viewport = container.querySelector('.related-graph-viewport') as HTMLElement;
    expect(viewport.style.overflow).toBe('auto');
  });
});

describe('RelatedRecordsGraph - color & labels', () => {
  it.each([
    ['SOP-1', '--teal'],
    ['INC-2', '--red'],
    ['CAP-3', '--gold'],
    ['CHG-4', '--navy-dim'],
    ['AUD-5', '--navy'],
    ['TRN-6', '--ink-dim'],
    ['MTG-7', '--plum'],
    ['NOTE-8', '--ink-dim'],
  ])('colors %s node with %s', async (id, colorVar) => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: [id] })} />);
    const svg = await screen.findByRole('img', { name: 'Linked records graph' });
    const rects = svg.querySelectorAll('rect');
    const outgoingRect = Array.from(rects).find((r) => r.getAttribute('stroke-width') === '2');
    expect(outgoingRect!.getAttribute('stroke')).toBe(`var(${colorVar})`);
  });

  it('falls back an unknown or malformed prefix to --ink-dim', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['XXX-1', 'no-dash'] })} />);
    const svg = await screen.findByRole('img', { name: 'Linked records graph' });
    const rects = svg.querySelectorAll('rect');
    Array.from(rects)
      .filter((r) => r.getAttribute('stroke-width') === '2')
      .forEach((r) => expect(r.getAttribute('stroke')).toBe('var(--ink-dim)'));
  });

  it('renders the center node bold regardless of type, and other nodes non-bold', async () => {
    mockFindBacklinks([{ type: 'sop', id: 'SOP-1', filename: 'SOP-1.md' }]);
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['CAP-2'] })} />);
    const svg = await screen.findByRole('img', { name: 'Linked records graph' });
    const rects = svg.querySelectorAll('rect');
    const widths = Array.from(rects).map((r) => r.getAttribute('stroke-width'));
    expect(widths.filter((w) => w === '3').length).toBe(1);
    expect(widths.filter((w) => w === '2').length).toBe(2);
  });
});

describe('RelatedRecordsGraph - truncate()', () => {
  // truncate() isn't exported, so exercise it indirectly through rendered node labels.
  it('does not truncate a title under the 24 char default limit', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ title: 'Short', related_documents: ['SOP-1'] })} />);
    await screen.findByRole('img', { name: 'Linked records graph' });
    expect(screen.getByText('Short')).toBeInTheDocument();
  });

  it('renders a 24-char title as-is', async () => {
    const title = 'A'.repeat(24);
    render(<RelatedRecordsGraph record={makeFakeRecord({ title, related_documents: ['SOP-1'] })} />);
    await screen.findByRole('img', { name: 'Linked records graph' });
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('truncates a title over 24 chars with an ellipsis', async () => {
    const title = 'A'.repeat(30);
    render(<RelatedRecordsGraph record={makeFakeRecord({ title, related_documents: ['SOP-1'] })} />);
    await screen.findByRole('img', { name: 'Linked records graph' });
    expect(screen.getByText('A'.repeat(23) + '…')).toBeInTheDocument();
  });

  it('falls back an id used as a label without crashing on an empty title', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ id: 'CAP-1', title: '', related_documents: ['SOP-1'] })} />);
    await screen.findByRole('img', { name: 'Linked records graph' });
    expect(screen.getByText('CAP-1')).toBeInTheDocument();
  });
});

describe('RelatedRecordsGraph - zoom controls', () => {
  it('zooms out and in, recalculating SVG width', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['SOP-1'] })} />);
    const svg = await screen.findByRole('img', { name: 'Linked records graph' });
    expect(screen.getByLabelText('Reset zoom')).toHaveTextContent('100%');

    fireEvent.click(screen.getByLabelText('Zoom out'));
    expect(screen.getByLabelText('Reset zoom')).toHaveTextContent('85%');
    expect(Math.round(parseFloat(svg.style.width))).toBe(85);

    fireEvent.click(screen.getByLabelText('Zoom in'));
    expect(screen.getByLabelText('Reset zoom')).toHaveTextContent('110%');
    expect(Math.round(parseFloat(svg.style.width))).toBe(110);
  });

  it('clamps zoom to [10%, 300%]', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['SOP-1'] })} />);
    await screen.findByRole('img', { name: 'Linked records graph' });

    for (let i = 0; i < 10; i++) fireEvent.click(screen.getByLabelText('Zoom out'));
    expect(screen.getByLabelText('Reset zoom')).toHaveTextContent('10%');

    for (let i = 0; i < 20; i++) fireEvent.click(screen.getByLabelText('Zoom in'));
    expect(screen.getByLabelText('Reset zoom')).toHaveTextContent('300%');
  });

  it('resets zoom to 100%', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['SOP-1'] })} />);
    await screen.findByRole('img', { name: 'Linked records graph' });

    fireEvent.click(screen.getByLabelText('Zoom in'));
    expect(screen.getByLabelText('Reset zoom')).toHaveTextContent('125%');

    fireEvent.click(screen.getByLabelText('Reset zoom'));
    expect(screen.getByLabelText('Reset zoom')).toHaveTextContent('100%');
  });
});

describe('RelatedRecordsGraph - fullscreen toggle', () => {
  it('calls requestFullscreen on the panel element when toggled', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['SOP-1'] })} />);
    await screen.findByRole('img', { name: 'Linked records graph' });

    const requestFullscreen = vi.fn();
    const panel = document.querySelector('.related-graph-panel') as HTMLElement & { requestFullscreen: () => void };
    panel.requestFullscreen = requestFullscreen;

    fireEvent.click(screen.getByLabelText('Toggle fullscreen'));
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('does not crash when requestFullscreen is unavailable', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['SOP-1'] })} />);
    await screen.findByRole('img', { name: 'Linked records graph' });

    const panel = document.querySelector('.related-graph-panel') as HTMLElement & { requestFullscreen?: () => void };
    delete panel.requestFullscreen;

    expect(() => fireEvent.click(screen.getByLabelText('Toggle fullscreen'))).not.toThrow();
  });
});

describe('RelatedRecordsGraph - accessibility', () => {
  it('gives the SVG a role and aria-label for screen readers', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['SOP-1'] })} />);
    const svg = await screen.findByRole('img', { name: 'Linked records graph' });
    expect(svg).toHaveAttribute('aria-label', 'Linked records graph');
  });

  it('gives every control button a descriptive aria-label', async () => {
    render(<RelatedRecordsGraph record={makeFakeRecord({ related_documents: ['SOP-1'] })} />);
    await screen.findByRole('img', { name: 'Linked records graph' });
    ['Zoom out', 'Reset zoom', 'Zoom in', 'Toggle fullscreen'].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
  });
});
