import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from './Dashboard';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('Dashboard', () => {
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
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/sops', { credentials: 'include' }));
    await waitFor(() =>
      expect(screen.getByText((_, el) => el?.textContent === 'All Controlled SOPs (2)')).toBeInTheDocument()
    );
  });
});
