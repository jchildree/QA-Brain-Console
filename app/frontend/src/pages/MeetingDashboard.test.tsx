import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MeetingDashboard } from './MeetingDashboard';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('MeetingDashboard', () => {
  it('lists Meeting records from the /api/meeting base URL', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 'MTG-1', status: 'Approved', version: '1.0', department: 'QA', review_date: '2026-01-01', owner: 'Jane', filename: 'MTG-1.md' },
      ],
    });

    render(
      <MemoryRouter>
        <MeetingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/meeting', { credentials: 'include' }));
    await waitFor(() =>
      expect(screen.getByText(/Overdue for Review/)).toBeInTheDocument()
    );
  });
});
