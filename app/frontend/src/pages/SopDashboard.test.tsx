import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SopDashboard } from './SopDashboard';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('SopDashboard', () => {
  it('lists SOP records from the /api/sops base URL', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'SOP-1', status: 'Approved', version: '1.0', department: 'QA', review_date: '2020-01-01', owner: 'Jane', filename: 'SOP-1.md' },
        { id: 'SOP-2', status: 'Draft', version: '1.0', department: 'QA', review_date: '2027-01-01', owner: 'Jane', filename: 'SOP-2.md' },
      ],
    });

    render(
      <MemoryRouter>
        <SopDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/sops', { credentials: 'include' }));
    await waitFor(() =>
      expect(screen.getByText(/Overdue for Review/)).toBeInTheDocument()
    );
  });
});
