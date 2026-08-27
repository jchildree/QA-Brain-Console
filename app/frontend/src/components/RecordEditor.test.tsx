import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecordEditor } from './RecordEditor';
import { capBlueprint } from '../blueprint/capBlueprint';
import * as relatedRecords from '../api/relatedRecords';
import * as backlinksApi from '../api/backlinks';

beforeEach(() => {
  vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockResolvedValue([]);
  vi.spyOn(relatedRecords, 'fetchTagVocabulary').mockResolvedValue([]);
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

  it('blocks save and shows an error when a required field is blank', async () => {
    const api = makeFakeApi();
    render(
      <MemoryRouter>
        <RecordEditor api={api} blueprint={capBlueprint} filename="CAP-1.md" type="cap" />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));

    fireEvent.change(screen.getByLabelText('Owner *'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Required fields missing: Owner')
    );
    expect(api.save).not.toHaveBeenCalled();
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

  it('renders an extra block passed via renderExtra, separate from the inline actions row', async () => {
    const api = makeFakeApi();
    render(
      <MemoryRouter>
        <RecordEditor
          api={api}
          blueprint={capBlueprint}
          filename="CAP-1.md"
          type="cap"
          renderExtra={(frontmatter) => <div>Sources for {String(frontmatter.id)}</div>}
        />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Sources for CAP-1')).toBeInTheDocument());
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

  it('shows an alert instead of the form when the initial load fails', async () => {
    const api = makeFakeApi();
    api.get.mockRejectedValue(new Error('Network error'));
    render(
      <MemoryRouter>
        <RecordEditor api={api} blueprint={capBlueprint} filename="CAP-1.md" type="cap" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Network error'));
  });

  // Audit finding: findBacklinks() errors are swallowed with .catch(() => setBacklinks([])) --
  // the record still loads and saves fine, just silently with no Referenced By panel.
  it('still loads and renders the form when the backlinks fetch fails, without surfacing an error', async () => {
    vi.spyOn(backlinksApi, 'findBacklinks').mockRejectedValue(new Error('backlinks unreachable'));
    const api = makeFakeApi();
    render(
      <MemoryRouter>
        <RecordEditor api={api} blueprint={capBlueprint} filename="CAP-1.md" type="cap" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));
    expect(screen.queryByText('Referenced By')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('RecordEditor - mergeRelated integration', () => {
  function makeFakeApiWithRelated(related: unknown) {
    const api = makeFakeApi();
    api.get.mockResolvedValue({
      filename: 'CAP-1.md',
      frontmatter: { id: 'CAP-1', status: 'Draft', version: '1.0', owner: 'Jane', department: 'QA', review_date: '2026-01-01', tags: [], root_cause: '', effectiveness_status: 'Pending', related_documents: related },
      body: '# Existing body\n',
      hash: 'hash-1',
    });
    return api;
  }

  it('merges body-parsed IDs into frontmatter related_documents on save', async () => {
    const api = makeFakeApiWithRelated(['SOP-1']);
    render(
      <MemoryRouter>
        <RecordEditor api={api} blueprint={capBlueprint} filename="CAP-1.md" type="cap" />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));

    fireEvent.change(screen.getByLabelText('Body'), { target: { value: '# Text\n## Related\n- CAP-2\n- INC-3' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(api.save).toHaveBeenCalledWith(
        'CAP-1.md',
        expect.objectContaining({ related_documents: ['SOP-1', 'CAP-2', 'INC-3'] }),
        expect.any(String),
        'hash-1'
      )
    );
  });

  it('updates component state to reflect the merged related_documents after save', async () => {
    const api = makeFakeApiWithRelated(['SOP-1']);
    render(
      <MemoryRouter>
        <RecordEditor api={api} blueprint={capBlueprint} filename="CAP-1.md" type="cap" />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));

    fireEvent.change(screen.getByLabelText('Body'), { target: { value: '# Text\n## Related\n- NEW-ID' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => expect(screen.getByText('NEW-ID')).toBeInTheDocument());
  });

  it('deduplicates when the body repeats an ID already in frontmatter', async () => {
    const api = makeFakeApiWithRelated(['SOP-1', 'CAP-2']);
    render(
      <MemoryRouter>
        <RecordEditor api={api} blueprint={capBlueprint} filename="CAP-1.md" type="cap" />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));

    fireEvent.change(screen.getByLabelText('Body'), { target: { value: '## Related\n- SOP-1\n- NEW-ID' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(api.save).toHaveBeenCalledWith(
        'CAP-1.md',
        expect.objectContaining({ related_documents: ['SOP-1', 'CAP-2', 'NEW-ID'] }),
        expect.any(String),
        'hash-1'
      )
    );
  });

  it('merges an inline body id (outside any Related heading) into related_documents on save', async () => {
    const api = makeFakeApiWithRelated(['SOP-1']);
    render(
      <MemoryRouter>
        <RecordEditor api={api} blueprint={capBlueprint} filename="CAP-1.md" type="cap" />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));

    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Mentions INC-20260731-001 in passing.' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(api.save).toHaveBeenCalledWith(
        'CAP-1.md',
        expect.objectContaining({ related_documents: ['SOP-1', 'INC-20260731-001'] }),
        expect.any(String),
        'hash-1'
      )
    );
  });

  it('does not link a record to itself when its own id appears inline in the body', async () => {
    const api = makeFakeApi();
    api.get.mockResolvedValue({
      filename: 'CAP-20260731-005.md',
      frontmatter: { id: 'CAP-20260731-005', status: 'Draft', version: '1.0', owner: 'Jane', department: 'QA', review_date: '2026-01-01', tags: [], root_cause: '', effectiveness_status: 'Pending', related_documents: [] },
      body: '# Existing body\n',
      hash: 'hash-1',
    });
    render(
      <MemoryRouter>
        <RecordEditor api={api} blueprint={capBlueprint} filename="CAP-20260731-005.md" type="cap" />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));

    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Self-referencing CAP-20260731-005 should not be linked.' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(api.save).toHaveBeenCalledWith(
        'CAP-20260731-005.md',
        expect.objectContaining({ related_documents: [] }),
        expect.any(String),
        'hash-1'
      )
    );
  });

  it('saves an empty related_documents array when there is no frontmatter or body Related section', async () => {
    const api = makeFakeApiWithRelated(undefined);
    render(
      <MemoryRouter>
        <RecordEditor api={api} blueprint={capBlueprint} filename="CAP-1.md" type="cap" />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(api.save).toHaveBeenCalledWith(
        'CAP-1.md',
        expect.objectContaining({ related_documents: [] }),
        expect.any(String),
        'hash-1'
      )
    );
  });
});

describe('RecordEditor - auto-tag on save', () => {
  it('merges vocabulary tags matched in the body into frontmatter.tags on save', async () => {
    const api = makeFakeApi();
    vi.spyOn(relatedRecords, 'fetchTagVocabulary').mockResolvedValue(['calibration', 'audit']);
    render(
      <MemoryRouter>
        <RecordEditor api={api} blueprint={capBlueprint} filename="CAP-1.md" type="cap" />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));

    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Notes on a calibration event.' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(api.save).toHaveBeenCalledWith(
        'CAP-1.md',
        expect.objectContaining({ tags: ['calibration'] }),
        expect.any(String),
        'hash-1'
      )
    );
  });
});

describe('RecordEditor - autoFill callback passed to renderExtra', () => {
  it('fills only empty fields and never status/approved_by, from what a renderExtra child pushes up', async () => {
    const api = makeFakeApi();
    render(
      <MemoryRouter>
        <RecordEditor
          api={api}
          blueprint={capBlueprint}
          filename="CAP-1.md"
          type="cap"
          renderExtra={(frontmatter, _body, autoFill) => (
            <div>
              <button
                type="button"
                onClick={() =>
                  autoFill({
                    root_cause: 'Extracted root cause', // frontmatter.root_cause starts as '' -- should fill
                    owner: 'Should Not Overwrite', // frontmatter.owner starts as 'Jane' -- should NOT fill
                    status: 'Approved', // must never land, regardless of current value
                    approved_by: 'Someone', // must never land either
                  })
                }
              >
                Apply Extraction
              </button>
              <span>root_cause: {String(frontmatter.root_cause)}</span>
              <span>owner: {String(frontmatter.owner)}</span>
              <span>status: {String(frontmatter.status)}</span>
            </div>
          )}
        />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));

    fireEvent.click(screen.getByText('Apply Extraction'));

    await waitFor(() => expect(screen.getByText('root_cause: Extracted root cause')).toBeInTheDocument());
    expect(screen.getByText('owner: Jane')).toBeInTheDocument();
    expect(screen.getByText('status: Draft')).toBeInTheDocument();
  });
});
