import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { NoteEditor } from './NoteEditor';
import * as relatedRecords from '../api/relatedRecords';
import * as backlinksApi from '../api/backlinks';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockResolvedValue([]);
  vi.spyOn(backlinksApi, 'findBacklinks').mockResolvedValue([]);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

function SopIntakeStub() {
  const location = useLocation();
  const rawText = (location.state as { rawText?: string } | null)?.rawText ?? '';
  return <p>sop intake, rawText: {rawText}</p>;
}

describe('NoteEditor', () => {
  it('loads the note and pre-fills the title and body', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        filename: 'NOTE-1.md',
        frontmatter: { id: 'NOTE-1', title: 'Meeting notes', folder: 'Meetings', tags: [] },
        body: 'Discussed the calibration drift.',
        hash: 'hash-1',
      }),
    });

    render(
      <MemoryRouter>
        <NoteEditor filename="NOTE-1.md" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByLabelText('Title *')).toHaveValue('Meeting notes'));
    expect(screen.getByLabelText('Body')).toHaveValue('Discussed the calibration drift.');
  });

  it('navigates to /{type}/new with the note body as rawText when a Promote button is clicked', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        filename: 'NOTE-1.md',
        frontmatter: { id: 'NOTE-1', title: 'Meeting notes', folder: '', tags: [] },
        body: 'Discussed the calibration drift.',
        hash: 'hash-1',
      }),
    });

    render(
      <MemoryRouter initialEntries={['/notes/NOTE-1.md']}>
        <Routes>
          <Route path="/notes/:filename" element={<NoteEditor filename="NOTE-1.md" />} />
          <Route path="/sop/new" element={<SopIntakeStub />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByLabelText('Title *')).toHaveValue('Meeting notes'));
    fireEvent.click(screen.getByText('SOP'));

    await waitFor(() => expect(screen.getByText('sop intake, rawText: Discussed the calibration drift.')).toBeInTheDocument());
  });
});
