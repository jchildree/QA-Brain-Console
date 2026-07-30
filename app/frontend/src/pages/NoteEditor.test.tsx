import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactElement } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { NoteEditor } from './NoteEditor';
import * as relatedRecords from '../api/relatedRecords';
import * as backlinksApi from '../api/backlinks';
import * as client from '../api/client';
import { AuthContext } from '../context/AuthContext';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockResolvedValue([]);
  vi.spyOn(backlinksApi, 'findBacklinks').mockResolvedValue([]);
  vi.spyOn(client, 'listActiveUsernames').mockResolvedValue(['alice', 'bob']);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

function renderAsAdmin(ui: ReactElement) {
  return render(
    <AuthContext.Provider value={{ username: 'alice', role: 'admin', isAdmin: true, logout: vi.fn() }}>{ui}</AuthContext.Provider>
  );
}

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

  it('shows the Assigned To field for an admin', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        filename: 'NOTE-1.md',
        frontmatter: { id: 'NOTE-1', title: 'Meeting notes', folder: '', tags: [], assigned_to: 'bob' },
        body: 'body',
        hash: 'hash-1',
      }),
    });

    renderAsAdmin(
      <MemoryRouter>
        <NoteEditor filename="NOTE-1.md" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByLabelText('Assigned To')).toHaveValue('bob'));
  });

  it('shows a read-only "Assigned to" line for a non-admin, and preserves it on save', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        filename: 'NOTE-1.md',
        frontmatter: { id: 'NOTE-1', title: 'Meeting notes', folder: '', tags: [], assigned_to: 'bob' },
        body: 'body',
        hash: 'hash-1',
      }),
    });
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, hash: 'hash-2' }) });

    render(
      <MemoryRouter>
        <NoteEditor filename="NOTE-1.md" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByLabelText('Title *')).toHaveValue('Meeting notes'));
    expect(screen.queryByLabelText('Assigned To')).not.toBeInTheDocument();
    expect(screen.getByText('Assigned to: bob')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/notes/NOTE-1.md',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            frontmatter: { id: 'NOTE-1', title: 'Meeting notes', folder: '', tags: [], assigned_to: 'bob' },
            body: 'body',
            expectedHash: 'hash-1',
          }),
        })
      )
    );
  });
});
