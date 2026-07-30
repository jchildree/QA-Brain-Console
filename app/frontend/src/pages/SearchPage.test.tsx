import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SearchPage } from './SearchPage';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('SearchPage', () => {
  it('searches /api/search?q= and renders results across types', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { type: 'sop', urlSlug: 'sops', filename: 'SOP-1.md', id: 'SOP-1' },
        { type: 'notes', urlSlug: 'notes', filename: 'NOTE-1.md', id: 'NOTE-1' },
      ],
    });

    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Search all records and notes'), { target: { value: 'calibration' } });
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/search?q=calibration', { credentials: 'include' })
    );
    expect(await screen.findByText('SOP-1')).toBeInTheDocument();
    expect(screen.getByText('NOTE-1')).toBeInTheDocument();
    expect(screen.getByText('SOP-1').closest('a')).toHaveAttribute('href', '/sop/SOP-1.md');
    expect(screen.getByText('NOTE-1').closest('a')).toHaveAttribute('href', '/notes/NOTE-1.md');
  });

  it('shows "No results." when nothing matches', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Search all records and notes'), { target: { value: 'nothing' } });
    fireEvent.click(screen.getByText('Search'));

    expect(await screen.findByText('No results.')).toBeInTheDocument();
  });
});
