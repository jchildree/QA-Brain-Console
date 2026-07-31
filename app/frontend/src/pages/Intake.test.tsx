import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Intake } from './Intake';
import * as relatedRecords from '../api/relatedRecords';
import * as client from '../api/client';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockResolvedValue([]);
  vi.spyOn(client, 'listActiveUsernames').mockResolvedValue([]);
});

describe('Intake', () => {
  it('extracts fields from pasted raw text and pre-fills the form', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ department: 'QC', tags: ['calibration'], purpose: 'p', scope: 's' }),
    });

    render(
      <MemoryRouter>
        <Intake />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Raw notes'), { target: { value: 'Calibrate the pH meter every shift.' } });
    fireEvent.click(screen.getByText('Extract'));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/intake/extract',
        expect.objectContaining({ body: JSON.stringify({ rawText: 'Calibrate the pH meter every shift.', type: 'sops' }) })
      )
    );
    await waitFor(() => expect(screen.getByLabelText('Department *')).toHaveValue('QC'));
  });

  it('disables Extract until raw text is entered', () => {
    render(
      <MemoryRouter>
        <Intake />
      </MemoryRouter>
    );
    expect(screen.getByText('Extract')).toBeDisabled();
  });

  it('creates the record via POST /api/sops and navigates to its editor route on save', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ department: 'QC', tags: [], purpose: 'p', scope: 's' }),
    });
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ filename: 'SOP-20260723-001.md', frontmatter: { id: 'SOP-20260723-001' } }),
    });

    render(
      <MemoryRouter initialEntries={['/sop/new']}>
        <Routes>
          <Route path="/sop/new" element={<Intake />} />
          <Route path="/sop/:filename" element={<p>editor route</p>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Raw notes'), { target: { value: 'Calibrate the pH meter every shift.' } });
    fireEvent.click(screen.getByText('Extract'));
    await waitFor(() => expect(screen.getByLabelText('Department *')).toHaveValue('QC'));

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/sops', expect.objectContaining({ method: 'POST' }))
    );
    await waitFor(() => expect(screen.getByText('editor route')).toBeInTheDocument());
  });
});
