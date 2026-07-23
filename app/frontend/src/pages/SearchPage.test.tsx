import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SearchPage } from './SearchPage';
import * as client from '../api/client';

beforeEach(() => {
  vi.spyOn(client, 'search').mockResolvedValue([
    { type: 'cap', urlSlug: 'cap', filename: 'CAP-1.md', id: 'CAP-1', status: 'Draft' },
    { type: 'sop', urlSlug: 'sops', filename: 'SOP-1.md', id: 'SOP-1', status: 'Approved' },
  ]);
});

describe('SearchPage', () => {
  it('searches on submit and renders results linking back to each record via its frontend route', async () => {
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'ph meter' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => expect(client.search).toHaveBeenCalledWith('ph meter'));
    expect(await screen.findByText('CAP-1')).toBeInTheDocument();
    expect(screen.getByText('SOP-1')).toBeInTheDocument();
    expect(screen.getByText('CAP-1').closest('a')).toHaveAttribute('href', '/cap/CAP-1.md');
    expect(screen.getByText('SOP-1').closest('a')).toHaveAttribute('href', '/sop/SOP-1.md');
  });

  it('shows a message when there are no results', async () => {
    vi.spyOn(client, 'search').mockResolvedValue([]);
    render(
      <MemoryRouter>
        <SearchPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'nothing' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText(/no results/i)).toBeInTheDocument();
  });
});
