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
  vi.spyOn(relatedRecords, 'fetchTagVocabulary').mockResolvedValue([]);
  vi.spyOn(backlinksApi, 'findBacklinks').mockResolvedValue([]);
  vi.spyOn(client, 'listActiveUsernames').mockResolvedValue(['alice', 'bob']);
  vi.spyOn(client, 'listEvidence').mockResolvedValue([]);
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
            frontmatter: {
              id: 'NOTE-1',
              title: 'Meeting notes',
              folder: '',
              tags: [],
              assigned_to: 'bob',
              related_documents: [],
            },
            body: 'body',
            expectedHash: 'hash-1',
          }),
        })
      )
    );
  });

  it('shows sources already attached to this note, filtered from the full evidence list', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        filename: 'NOTE-1.md',
        frontmatter: { id: 'NOTE-1', title: 'Meeting notes', folder: '', tags: [] },
        body: 'body',
        hash: 'hash-1',
      }),
    });
    (client.listEvidence as any).mockResolvedValue([
      { type: 'notes', urlSlug: 'notes', recordFilename: 'NOTE-1.md', attachmentFilename: 'report.pdf' },
      { type: 'notes', urlSlug: 'notes', recordFilename: 'NOTE-2.md', attachmentFilename: 'other-note-file.pdf' },
      { type: 'sop', urlSlug: 'sops', recordFilename: 'SOP-1.md', attachmentFilename: 'sop-file.pdf' },
    ]);

    render(
      <MemoryRouter>
        <NoteEditor filename="NOTE-1.md" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('report.pdf')).toBeInTheDocument());
    expect(screen.queryByText('other-note-file.pdf')).not.toBeInTheDocument();
    expect(screen.queryByText('sop-file.pdf')).not.toBeInTheDocument();
  });

  it('uploads a selected file as a Source and refreshes the list', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        filename: 'NOTE-1.md',
        frontmatter: { id: 'NOTE-1', title: 'Meeting notes', folder: '', tags: [] },
        body: 'body',
        hash: 'hash-1',
      }),
    });
    vi.spyOn(client, 'uploadAttachment').mockResolvedValue({ attachmentPath: 'attachments/NOTE-1/report.pdf', extracted: null, note: null });
    (client.listEvidence as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ type: 'notes', urlSlug: 'notes', recordFilename: 'NOTE-1.md', attachmentFilename: 'report.pdf' }]);

    render(
      <MemoryRouter>
        <NoteEditor filename="NOTE-1.md" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('No source attached yet.')).toBeInTheDocument());

    const file = new File(['content'], 'report.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Add Source'), { target: { files: [file] } });

    await waitFor(() => expect(client.uploadAttachment).toHaveBeenCalledWith('notes', 'NOTE-1.md', file));
    await waitFor(() => expect(screen.getByText('report.pdf')).toBeInTheDocument());
    expect(screen.queryByText('No source attached yet.')).not.toBeInTheDocument();
  });

  it('auto-fills empty frontmatter fields from a text attachment\'s extraction, never status, and shows a review note', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        filename: 'NOTE-1.md',
        // folder starts empty -- eligible to be filled. title is already set --
        // must not be overwritten even though the extraction also guesses one.
        frontmatter: { id: 'NOTE-1', title: 'Meeting notes', folder: '', tags: [] },
        body: 'body',
        hash: 'hash-1',
      }),
    });
    vi.spyOn(client, 'uploadAttachment').mockResolvedValue({
      attachmentPath: 'attachments/NOTE-1/report.txt',
      extracted: { folder: 'Meetings', title: 'AI Guessed Title', status: 'Approved' },
      note: null,
    });

    render(
      <MemoryRouter>
        <NoteEditor filename="NOTE-1.md" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByLabelText('Title *')).toHaveValue('Meeting notes'));

    const file = new File(['content'], 'report.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText('Add Source'), { target: { files: [file] } });

    await waitFor(() => expect(screen.getByLabelText('Folder')).toHaveValue('Meetings'));
    // Title started non-empty -- extraction must not clobber it.
    expect(screen.getByLabelText('Title *')).toHaveValue('Meeting notes');
    expect(screen.getByText(/Filled 1 empty field/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/notes/NOTE-1.md', expect.objectContaining({ method: 'PUT' })));
    const putCall = (fetch as any).mock.calls.find((c: any[]) => c[1]?.method === 'PUT');
    const savedFrontmatter = JSON.parse(putCall[1].body).frontmatter;
    expect(savedFrontmatter.status).toBeUndefined();
  });
});
