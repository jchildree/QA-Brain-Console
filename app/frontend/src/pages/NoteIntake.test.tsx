import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { NoteIntake } from './NoteIntake';
import * as relatedRecords from '../api/relatedRecords';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockResolvedValue([]);
});

describe('NoteIntake', () => {
  it('has no raw-text/Extract step -- just the form and a body textarea', () => {
    render(
      <MemoryRouter>
        <NoteIntake />
      </MemoryRouter>
    );
    expect(screen.queryByLabelText('Raw notes')).not.toBeInTheDocument();
    expect(screen.queryByText('Extract')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Title *')).toBeInTheDocument();
    expect(screen.getByLabelText('Body')).toBeInTheDocument();
  });

  it('pre-fills the body from router state (used by the promote-from-note flow in reverse)', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/notes/new', state: { rawText: 'carried over text' } }]}>
        <NoteIntake />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Body')).toHaveValue('carried over text');
  });

  it('pre-fills the title from router state (e.g. an uploaded file\'s name)', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/notes/new', state: { title: 'meeting-notes' } }]}>
        <NoteIntake />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Title *')).toHaveValue('meeting-notes');
  });

  it('creates the note via POST /api/notes and navigates to its editor route on save', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ filename: 'NOTE-20260730-001.md', frontmatter: { id: 'NOTE-20260730-001' } }),
    });

    render(
      <MemoryRouter initialEntries={['/notes/new']}>
        <Routes>
          <Route path="/notes/new" element={<NoteIntake />} />
          <Route path="/notes/:filename" element={<p>editor route</p>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Meeting notes' } });
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'body text' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/notes', expect.objectContaining({ method: 'POST' }))
    );
    await waitFor(() => expect(screen.getByText('editor route')).toBeInTheDocument());
  });
});
