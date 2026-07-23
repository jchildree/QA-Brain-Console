import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CapIntake } from './CapIntake';
import * as relatedRecords from '../api/relatedRecords';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockResolvedValue([]);
});

describe('CapIntake', () => {
  it('extracts CAP-specific fields via /api/intake/extract with type=cap', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ department: 'QC', tags: [], root_cause: 'r', effectiveness_status: 'Pending' }),
    });

    render(
      <MemoryRouter>
        <CapIntake />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Raw notes'), { target: { value: 'Some CAP note.' } });
    fireEvent.click(screen.getByText('Extract'));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/intake/extract',
        expect.objectContaining({ body: JSON.stringify({ rawText: 'Some CAP note.', type: 'cap' }) })
      )
    );
    expect(await screen.findByLabelText('Root Cause')).toHaveValue('r');
  });

  it('creates the record via POST /api/cap and navigates to its editor route on save', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ department: 'QC', tags: [], root_cause: 'r', effectiveness_status: 'Pending' }),
    });
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ filename: 'CAP-20260723-001.md', frontmatter: { id: 'CAP-20260723-001' } }),
    });

    render(
      <MemoryRouter initialEntries={['/cap/new']}>
        <Routes>
          <Route path="/cap/new" element={<CapIntake />} />
          <Route path="/cap/:filename" element={<p>editor route</p>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Raw notes'), { target: { value: 'Some CAP note.' } });
    fireEvent.click(screen.getByText('Extract'));
    await waitFor(() => expect(screen.getByLabelText('Department *')).toHaveValue('QC'));

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/cap',
        expect.objectContaining({ method: 'POST' })
      )
    );
    await waitFor(() => expect(screen.getByText('editor route')).toBeInTheDocument());
  });
});
