import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Overview } from './Overview';
import * as client from '../api/client';

describe('Overview', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
  });

  it('shows real, live counts for SOP and all 5 other record types', async () => {
    vi.spyOn(client, 'listSops').mockResolvedValue([
      { id: 'SOP-1', status: 'Approved', version: '1.0', department: 'QA', review_date: '2020-01-01', owner: 'Jane', filename: 'SOP-1.md' },
      { id: 'SOP-2', status: 'Draft', version: '1.0', department: 'QA', review_date: '2027-01-01', owner: 'Jane', filename: 'SOP-2.md' },
    ]);

    render(
      <MemoryRouter>
        <Overview />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('2 total, 1 overdue for review')).toBeInTheDocument());
    ['CAP', 'Incident', 'Change', 'Audit', 'Training'].forEach((type) => {
      expect(screen.getByText(type)).toBeInTheDocument();
    });
    expect(screen.getAllByText('0 total, 0 overdue for review')).toHaveLength(5);
    expect(screen.getAllByText('Live')).toHaveLength(6);
  });

  it('shows an error message when the fetch fails', async () => {
    vi.spyOn(client, 'listSops').mockRejectedValue(new Error('Failed to load SOPs'));

    render(
      <MemoryRouter>
        <Overview />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load SOPs'));
  });
});
