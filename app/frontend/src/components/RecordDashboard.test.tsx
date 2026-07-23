import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RecordDashboard } from './RecordDashboard';

const FIXED_NOW = new Date('2026-07-15T00:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

function makeFakeApi(records: any[]) {
  return {
    list: vi.fn().mockResolvedValue(records),
    get: vi.fn(),
    save: vi.fn(),
    create: vi.fn(),
    extract: vi.fn(),
  } as any;
}

describe('RecordDashboard', () => {
  it('groups records into controlled, overdue, in-draft-or-review, and obsolete sections', async () => {
    const api = makeFakeApi([
      { id: 'CAP-1', status: 'Approved', version: '1.0', department: 'QA', review_date: '2026-01-01', owner: 'Jane', filename: 'CAP-1.md' },
      { id: 'CAP-2', status: 'Draft', version: '1.0', department: 'QA', review_date: '2027-01-01', owner: 'Jane', filename: 'CAP-2.md' },
      { id: 'CAP-3', status: 'Obsolete', version: '1.0', department: 'QC', review_date: '2025-01-01', owner: 'Jane', filename: 'CAP-3.md' },
    ]);

    render(<RecordDashboard api={api} title="CAP" />);

    await waitFor(() => expect(screen.getByText('All Controlled CAPs (2)')).toBeInTheDocument());
    expect(screen.getByText('Overdue for Review (1)')).toBeInTheDocument();
    expect(screen.getByText('In Draft / Review (1)')).toBeInTheDocument();
    expect(screen.getByText('Obsolete CAPs (1)')).toBeInTheDocument();
  });

  it('shows an error message when the fetch fails', async () => {
    const api = makeFakeApi([]);
    api.list.mockRejectedValue(new Error('Failed to load cap records'));

    render(<RecordDashboard api={api} title="CAP" />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load cap records'));
  });
});
