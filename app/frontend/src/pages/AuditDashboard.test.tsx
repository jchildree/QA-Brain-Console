import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuditDashboard } from './AuditDashboard';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('AuditDashboard', () => {
  it('lists Audit records from the /api/audit base URL', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 'AUD-1', status: 'Approved', version: '1.0', department: 'QA', review_date: '2026-01-01', owner: 'Jane', filename: 'AUD-1.md' },
      ],
    });

    render(
      <MemoryRouter>
        <AuditDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/audit', { credentials: 'include' }));
    await waitFor(() =>
      expect(screen.getByText(/Overdue for Review/)).toBeInTheDocument()
    );
  });
});
