import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ChangeDashboard } from './ChangeDashboard';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('ChangeDashboard', () => {
  it('lists Change records from the /api/change base URL', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 'CHG-1', status: 'Approved', version: '1.0', department: 'QA', review_date: '2026-01-01', owner: 'Jane', filename: 'CHG-1.md' },
      ],
    });

    render(<ChangeDashboard />);

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/change', { credentials: 'include' }));
    await waitFor(() =>
      expect(screen.getByText((_, el) => el?.textContent === 'All Controlled Changes (1)')).toBeInTheDocument()
    );
  });
});
