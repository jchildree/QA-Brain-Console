import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SopEditor } from './SopEditor';
import * as relatedRecords from '../api/relatedRecords';
import * as client from '../api/client';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockResolvedValue([]);
  vi.spyOn(relatedRecords, 'fetchTagVocabulary').mockResolvedValue([]);
  vi.spyOn(client, 'listActiveUsernames').mockResolvedValue([]);
});

describe('SopEditor', () => {
  it('loads the SOP from /api/sops and pre-fills the form and body textarea', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        filename: 'SOP-1.md',
        frontmatter: { status: 'Draft', version: '1.0', owner: 'Jane', department: 'QA', review_date: '2026-01-01', tags: [] },
        body: '# Existing body\n',
      }),
    });

    render(
      <MemoryRouter>
        <SopEditor filename="SOP-1.md" />
      </MemoryRouter>
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/sops/SOP-1.md', { credentials: 'include' }));
    expect(await screen.findByLabelText('Owner *')).toHaveValue('Jane');
    expect(screen.getByLabelText('Body')).toHaveValue('# Existing body\n');
  });

  it('saves via PUT /api/sops/:filename', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        filename: 'SOP-1.md',
        frontmatter: { status: 'Draft', version: '1.0', owner: 'Jane', department: 'QA', review_date: '2026-01-01', tags: [] },
        body: '# Existing body\n',
      }),
    });
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });

    render(
      <MemoryRouter>
        <SopEditor filename="SOP-1.md" />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));

    fireEvent.change(screen.getByLabelText('Owner *'), { target: { value: 'New Owner' } });
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: '# Updated body\n' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/sops/SOP-1.md',
        expect.objectContaining({ method: 'PUT' })
      )
    );
  });
});
