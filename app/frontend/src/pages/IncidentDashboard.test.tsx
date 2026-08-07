import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { IncidentDashboard } from './IncidentDashboard';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('IncidentDashboard', () => {
  it('lists Incident records from the /api/incident base URL', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 'INC-1', status: 'Approved', version: '1.0', department: 'QA', review_date: '2026-01-01', owner: 'Jane', filename: 'INC-1.md' },
      ],
    });

    render(
      <MemoryRouter>
        <IncidentDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/incident', { credentials: 'include' }));
    await waitFor(() =>
      expect(screen.getByText(/Overdue for Review/)).toBeInTheDocument()
    );
  });
});
