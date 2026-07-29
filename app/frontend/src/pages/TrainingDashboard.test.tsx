import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TrainingDashboard } from './TrainingDashboard';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('TrainingDashboard', () => {
  it('lists Training records from the /api/training base URL', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 'TRN-1', status: 'Approved', version: '1.0', department: 'QA', review_date: '2026-01-01', owner: 'Jane', filename: 'TRN-1.md' },
      ],
    });

    render(
      <MemoryRouter>
        <TrainingDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/training', { credentials: 'include' }));
    await waitFor(() =>
      expect(screen.getByText((_, el) => el?.textContent === 'All Controlled Trainings (1)')).toBeInTheDocument()
    );
  });
});
