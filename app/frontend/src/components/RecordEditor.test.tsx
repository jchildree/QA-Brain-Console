import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecordEditor } from './RecordEditor';
import { capBlueprint } from '../blueprint/capBlueprint';
import * as relatedRecords from '../api/relatedRecords';
import * as backlinksApi from '../api/backlinks';

beforeEach(() => {
  vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockResolvedValue([]);
  vi.spyOn(backlinksApi, 'findBacklinks').mockResolvedValue([]);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

function makeFakeApi() {
  return {
    list: vi.fn(),
    get: vi.fn().mockResolvedValue({
      filename: 'CAP-1.md',
      frontmatter: { id: 'CAP-1', status: 'Draft', version: '1.0', owner: 'Jane', department: 'QA', review_date: '2026-01-01', tags: [], root_cause: '', effectiveness_status: 'Pending' },
      body: '# Existing body\n',
      hash: 'hash-1',
    }),
    save: vi.fn().mockResolvedValue({ hash: 'hash-2' }),
    create: vi.fn(),
    extract: vi.fn(),
    remove: vi.fn().mockResolvedValue(undefined),
  } as any;
}

describe('RecordEditor', () => {
  it('loads the record and pre-fills the form and body textarea', async () => {
    const api = makeFakeApi();
    render(
      <MemoryRouter>
        <RecordEditor api={api} blueprint={capBlueprint} filename="CAP-1.md" type="cap" />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));
    expect(screen.getByLabelText('Body')).toHaveValue('# Existing body\n');
  });

  it('saves edited frontmatter and body on submit', async () => {
    const api = makeFakeApi();
    render(
      <MemoryRouter>
        <RecordEditor api={api} blueprint={capBlueprint} filename="CAP-1.md" type="cap" />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));

    fireEvent.change(screen.getByLabelText('Owner *'), { target: { value: 'New Owner' } });
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: '# Updated body\n' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(api.save).toHaveBeenCalledWith(
        'CAP-1.md',
        expect.objectContaining({ owner: 'New Owner' }),
        '# Updated body\n',
        'hash-1'
      )
    );
  });

  it('shows a Reload action instead of the raw error on a save conflict', async () => {
    const api = makeFakeApi();
    const { SaveConflictError } = await import('../api/client');
    api.save.mockRejectedValueOnce(new SaveConflictError());
    render(
      <MemoryRouter>
        <RecordEditor api={api} blueprint={capBlueprint} filename="CAP-1.md" type="cap" />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => expect(screen.getByText('Reload')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Reload'));

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('Reload')).not.toBeInTheDocument();
  });

  it('deletes the record after confirmation', async () => {
    const api = makeFakeApi();
    render(
      <MemoryRouter>
        <RecordEditor api={api} blueprint={capBlueprint} filename="CAP-1.md" type="cap" />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => expect(api.remove).toHaveBeenCalledWith('CAP-1.md'));
  });

  it('renders extra actions passed via renderExtraActions', async () => {
    const api = makeFakeApi();
    render(
      <MemoryRouter>
        <RecordEditor
          api={api}
          blueprint={capBlueprint}
          filename="CAP-1.md"
          type="cap"
          renderExtraActions={(frontmatter) => <button type="button">Promote {String(frontmatter.id)}</button>}
        />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Promote CAP-1')).toBeInTheDocument());
  });

  it('shows a Referenced By panel when other records link to this one', async () => {
    vi.spyOn(backlinksApi, 'findBacklinks').mockResolvedValue([{ type: 'sop', id: 'SOP-1', filename: 'SOP-1.md' }]);
    const api = makeFakeApi();
    render(
      <MemoryRouter>
        <RecordEditor api={api} blueprint={capBlueprint} filename="CAP-1.md" type="cap" />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Referenced By')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'SOP: SOP-1' })).toHaveAttribute('href', '/sop/SOP-1.md');
  });
});
