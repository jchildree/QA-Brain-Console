import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Overview } from './Overview';

function selectFiles(files: File[]) {
  const input = screen.getByLabelText('Select file or folder') as HTMLInputElement;
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  fireEvent.change(input);
}

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

  it('prefills raw text from a single dropped file and accessions straight to a new Note, not a fixed record type', async () => {
    mockFetchByUrl({ '/api/sops': SOP_RECORDS });

    function NoteIntakeStub() {
      const location = useLocation();
      const state = location.state as { rawText?: string; folder?: string } | null;
      return (
        <p>
          note intake, rawText: {state?.rawText}, folder: {state?.folder}
        </p>
      );
    }

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/notes/new" element={<NoteIntakeStub />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Open Records, 14-Day Trace');

    const file = new File(['Discussed the drift.'], 'note.md', { type: 'text/markdown' });
    Object.defineProperty(file, 'webkitRelativePath', { value: '' });
    selectFiles([file]);

    await waitFor(() => expect(screen.getByLabelText('Accession notes')).toHaveValue('Discussed the drift.'));
    fireEvent.click(screen.getByText('UPLOAD'));

    await waitFor(() =>
      expect(screen.getByText('note intake, rawText: Discussed the drift., folder:')).toBeInTheDocument()
    );
  });

  it('bulk-imports every file in a dropped folder as its own note, using each file\'s own frontmatter', async () => {
    mockFetchByUrl({ '/api/sops': SOP_RECORDS });
    (fetch as any).mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/api/parse-frontmatter')) {
        const { rawText } = JSON.parse(init!.body as string);
        return Promise.resolve({
          ok: true,
          json: async () => ({ frontmatter: { title: rawText.includes('drift') ? 'Drift note' : 'Other note' }, body: rawText }),
        });
      }
      if (url.endsWith('/api/notes') && init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({ filename: 'NOTE-1.md', frontmatter: {} }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(
      <MemoryRouter>
        <Overview />
      </MemoryRouter>
    );

    await screen.findByText('Open Records, 14-Day Trace');

    const fileA = new File(['Notes about drift.'], 'a.md', { type: 'text/markdown' });
    const fileB = new File(['Other content.'], 'b.md', { type: 'text/markdown' });
    Object.defineProperty(fileA, 'webkitRelativePath', { value: 'Meetings/a.md' });
    Object.defineProperty(fileB, 'webkitRelativePath', { value: 'Meetings/b.md' });
    selectFiles([fileA, fileB]);

    await waitFor(() => expect(screen.getByText(/Imported 2 notes from Meetings\//)).toBeInTheDocument());

    const notePosts = (fetch as any).mock.calls.filter(([url, init]: [string, RequestInit]) => url.endsWith('/api/notes') && init?.method === 'POST');
    expect(notePosts).toHaveLength(2);
  });
});
