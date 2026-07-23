import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import * as client from '../api/client';

const FIXED_NOW = new Date('2026-07-15T00:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

describe('Dashboard', () => {
  it('groups SOPs into controlled, overdue, in-draft-or-review, and obsolete sections', async () => {
    vi.spyOn(client, 'listSops').mockResolvedValue([
      { id: 'SOP-1', status: 'Approved', version: '1.0', department: 'QA', review_date: '2026-01-01', owner: 'Jane', filename: 'SOP-1.md' },
      { id: 'SOP-2', status: 'Draft', version: '1.0', department: 'QA', review_date: '2027-01-01', owner: 'Jane', filename: 'SOP-2.md' },
      { id: 'SOP-3', status: 'Obsolete', version: '1.0', department: 'QC', review_date: '2025-01-01', owner: 'Jane', filename: 'SOP-3.md' },
    ]);

    render(<Dashboard />);

    await waitFor(() => expect(screen.getByText('All Controlled SOPs (2)')).toBeInTheDocument());
    expect(screen.getByText('Overdue for Review (1)')).toBeInTheDocument();
    expect(screen.getByText('In Draft / Review (1)')).toBeInTheDocument();
    expect(screen.getByText('Obsolete SOPs (1)')).toBeInTheDocument();
  });

  it('shows an error message when the fetch fails', async () => {
    vi.spyOn(client, 'listSops').mockRejectedValue(new Error('Failed to load SOPs'));

    render(<Dashboard />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load SOPs'));
  });
});
