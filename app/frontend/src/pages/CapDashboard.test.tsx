import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CapDashboard } from './CapDashboard';

const FIXED_NOW = new Date('2026-07-15T00:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
  vi.stubGlobal('fetch', vi.fn());
});

describe('CapDashboard', () => {
  it('lists CAP records from the /api/cap base URL', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 'CAP-1', status: 'Approved', version: '1.0', department: 'QA', review_date: '2026-01-01', owner: 'Jane', filename: 'CAP-1.md' },
      ],
    });

    render(<CapDashboard />);

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/cap', { credentials: 'include' }));
    await waitFor(() =>
      expect(screen.getByText((_, el) => el?.textContent === 'All Controlled CAPs (1)')).toBeInTheDocument()
    );
  });
});
