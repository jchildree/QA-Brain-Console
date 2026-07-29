import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Overview } from './Overview';

const SOP_RECORDS = [
  { id: 'SOP-1', status: 'Approved', version: '1.0', department: 'QA', review_date: '2020-01-01', owner: 'Jane', filename: 'SOP-1.md' },
  { id: 'SOP-2', status: 'Draft', version: '1.0', department: 'QA', review_date: '2027-01-01', owner: 'Jane', filename: 'SOP-2.md' },
];

function mockFetchByUrl(handlers: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      for (const [match, data] of Object.entries(handlers)) {
        if (url.includes(match)) return Promise.resolve({ ok: true, json: async () => data });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    })
  );
}

describe('Overview', () => {
  it('renders the strip chart and specimen cards for records across all types', async () => {
    mockFetchByUrl({ '/api/sops': SOP_RECORDS });

    render(
      <MemoryRouter>
        <Overview />
      </MemoryRouter>
    );

    expect(await screen.findByText('Open Records, 14-Day Trace')).toBeInTheDocument();
    expect(await screen.findByText('SOP-1')).toBeInTheDocument();
    expect(screen.getByText('SOP-2')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('Overdue reviews').length).toBeGreaterThan(0));
  });

  it('shows an error message when a record type fails to load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to load sops records')));

    render(
      <MemoryRouter>
        <Overview />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Failed to load/));
  });
});
