import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RecordIntake } from './RecordIntake';
import { capBlueprint } from '../blueprint/capBlueprint';
import * as relatedRecords from '../api/relatedRecords';

beforeEach(() => {
  vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockResolvedValue([]);
  vi.spyOn(relatedRecords, 'fetchTagVocabulary').mockResolvedValue([]);
});

function makeFakeApi() {
  return {
    list: vi.fn(),
    get: vi.fn(),
    save: vi.fn(),
    create: vi.fn(),
    extract: vi.fn().mockResolvedValue({ department: 'QC', tags: ['calibration'], root_cause: 'r', effectiveness_status: 'Pending' }),
  } as any;
}

describe('RecordIntake', () => {
  it('extracts fields from pasted raw text and pre-fills the form', async () => {
    const api = makeFakeApi();
    render(<RecordIntake api={api} blueprint={capBlueprint} onSave={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Raw notes'), { target: { value: 'Calibrate the pH meter every shift.' } });
    fireEvent.click(screen.getByText('Extract'));

    await waitFor(() => expect(api.extract).toHaveBeenCalledWith('Calibrate the pH meter every shift.'));
    await waitFor(() => expect(screen.getByLabelText('Department *')).toHaveValue('QC'));
  });

  it('disables Extract until raw text is entered', () => {
    const api = makeFakeApi();
    render(<RecordIntake api={api} blueprint={capBlueprint} onSave={vi.fn()} />);
    expect(screen.getByText('Extract')).toBeDisabled();
  });

  it('calls onSave with the current frontmatter and body when Save is clicked', async () => {
    const api = makeFakeApi();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<RecordIntake api={api} blueprint={capBlueprint} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Raw notes'), { target: { value: 'Calibrate the pH meter every shift.' } });
    fireEvent.click(screen.getByText('Extract'));
    await waitFor(() => expect(screen.getByLabelText('Department *')).toHaveValue('QC'));

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ department: 'QC' }), expect.any(String))
    );
  });

  it('pre-fills the body from initialRawText immediately (e.g. promoting a note)', () => {
    const api = makeFakeApi();
    render(<RecordIntake api={api} blueprint={capBlueprint} onSave={vi.fn()} initialRawText="Calibrate the pH meter every shift." />);
    expect(screen.getByLabelText('Body')).toHaveValue('Calibrate the pH meter every shift.');
  });

  it('auto-runs extraction when arriving with initialRawText, without a manual Extract click', async () => {
    const api = makeFakeApi();
    render(<RecordIntake api={api} blueprint={capBlueprint} onSave={vi.fn()} initialRawText="Calibrate the pH meter every shift." />);

    await waitFor(() => expect(api.extract).toHaveBeenCalledWith('Calibrate the pH meter every shift.'));
    await waitFor(() => expect(screen.getByLabelText('Department *')).toHaveValue('QC'));
  });

  it('does not auto-extract when there is no initialRawText', () => {
    const api = makeFakeApi();
    render(<RecordIntake api={api} blueprint={capBlueprint} onSave={vi.fn()} />);
    expect(api.extract).not.toHaveBeenCalled();
  });

  it('pre-fills the title from initialTitle (e.g. a promoted note\'s title, or an uploaded file\'s name)', () => {
    const api = makeFakeApi();
    render(<RecordIntake api={api} blueprint={capBlueprint} onSave={vi.fn()} initialTitle="Calibration drift" />);
    expect(screen.getByLabelText('Title')).toHaveValue('Calibration drift');
  });

  it('keeps the initialTitle even after auto-extraction returns its own title guess', async () => {
    const api = makeFakeApi();
    api.extract.mockResolvedValue({ title: 'AI guessed title', department: 'QC', tags: [] });
    render(
      <RecordIntake
        api={api}
        blueprint={capBlueprint}
        onSave={vi.fn()}
        initialRawText="Calibrate the pH meter every shift."
        initialTitle="Calibration drift"
      />
    );

    await waitFor(() => expect(screen.getByLabelText('Department *')).toHaveValue('QC'));
    expect(screen.getByLabelText('Title')).toHaveValue('Calibration drift');
  });

  it('strips leading markdown heading/bold syntax from an AI-extracted title', async () => {
    const api = makeFakeApi();
    api.extract.mockResolvedValue({ title: '# Case: EQMS Documentation Drift', department: 'QC', tags: [] });
    render(<RecordIntake api={api} blueprint={capBlueprint} onSave={vi.fn()} initialRawText="# Case: EQMS Documentation Drift\n\nbody" />);
    await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Case: EQMS Documentation Drift'));
  });

  it('defaults version to v1 when extraction does not return one', async () => {
    const api = makeFakeApi();
    render(<RecordIntake api={api} blueprint={capBlueprint} onSave={vi.fn()} initialRawText="Some text." />);
    await waitFor(() => expect(screen.getByLabelText('Version *')).toHaveValue('v1'));
  });

  it('keeps an AI-extracted version instead of the v1 default when one is provided', async () => {
    const api = makeFakeApi();
    api.extract.mockResolvedValue({ version: 'v3', department: 'QC', tags: [] });
    render(<RecordIntake api={api} blueprint={capBlueprint} onSave={vi.fn()} initialRawText="Some text." />);
    await waitFor(() => expect(screen.getByLabelText('Version *')).toHaveValue('v3'));
  });

  it('re-enables Extract and shows an error instead of getting stuck when extraction fails', async () => {
    const api = makeFakeApi();
    api.extract.mockRejectedValue(new Error('AI provider unreachable'));
    render(<RecordIntake api={api} blueprint={capBlueprint} onSave={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Raw notes'), { target: { value: 'Some text.' } });
    fireEvent.click(screen.getByText('Extract'));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('AI provider unreachable'));
    expect(screen.getByText('Extract')).not.toBeDisabled();
  });

  it('does not get stuck on the auto-run extraction failing either', async () => {
    const api = makeFakeApi();
    api.extract.mockRejectedValue(new Error('AI provider unreachable'));
    render(<RecordIntake api={api} blueprint={capBlueprint} onSave={vi.fn()} initialRawText="Some text." />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('AI provider unreachable'));
    expect(screen.getByText('Extract')).not.toBeDisabled();
  });
});

describe('RecordIntake - mergeRelated during extraction', () => {
  it('merges API-returned and body-parsed related documents', async () => {
    const api = makeFakeApi();
    api.extract.mockResolvedValue({ related_documents: ['SOP-1'], department: 'QC', tags: [] });
    render(<RecordIntake api={api} blueprint={capBlueprint} onSave={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Raw notes'), { target: { value: 'Content\n## Related\n- CAP-2' } });
    fireEvent.click(screen.getByText('Extract'));

    await waitFor(() => expect(screen.getByText('SOP-1')).toBeInTheDocument());
    expect(screen.getByText('CAP-2')).toBeInTheDocument();
  });

  it('deduplicates across API and body-parsed results', async () => {
    const api = makeFakeApi();
    api.extract.mockResolvedValue({ related_documents: ['SOP-1'], department: 'QC', tags: [] });
    render(<RecordIntake api={api} blueprint={capBlueprint} onSave={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Raw notes'), { target: { value: 'Content\n## Related\n- SOP-1\n- CAP-2' } });
    fireEvent.click(screen.getByText('Extract'));

    await waitFor(() => expect(screen.getByText('CAP-2')).toBeInTheDocument());
    expect(screen.getAllByText('SOP-1')).toHaveLength(1);
  });
});

describe('RecordIntake - mergeRelated on save', () => {
  it('catches a "## Related" section even without an Extract click', async () => {
    const api = makeFakeApi();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<RecordIntake api={api} blueprint={capBlueprint} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Content\n## Related\n- SOP-1\n- CAP-2' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ related_documents: ['SOP-1', 'CAP-2'] }),
        expect.any(String)
      )
    );
    expect(api.extract).not.toHaveBeenCalled();
  });

  it('merges extracted and body-parsed related documents when both exist', async () => {
    const api = makeFakeApi();
    api.extract.mockResolvedValue({ related_documents: ['SOP-1'], department: 'QC', tags: [] });
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <RecordIntake
        api={api}
        blueprint={capBlueprint}
        onSave={onSave}
        initialRawText={'Content\n## Related\n- CAP-2'}
      />
    );
    await waitFor(() => expect(screen.getByLabelText('Department *')).toHaveValue('QC'));

    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Content\n## Related\n- CAP-2\n- INC-3' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ related_documents: ['SOP-1', 'CAP-2', 'INC-3'] }),
        expect.any(String)
      )
    );
  });

  it('keeps initialTitle protection while related_documents merges extraction and body-parsed IDs', async () => {
    const api = makeFakeApi();
    api.extract.mockResolvedValue({ title: 'AI Guessed Title', related_documents: ['CAP-1'], department: 'QC', tags: [] });
    render(
      <RecordIntake
        api={api}
        blueprint={capBlueprint}
        onSave={vi.fn()}
        initialRawText={'Some content\n## Related\n- SOP-1'}
        initialTitle="My Note Title"
      />
    );

    await waitFor(() => expect(screen.getByLabelText('Department *')).toHaveValue('QC'));
    expect(screen.getByLabelText('Title')).toHaveValue('My Note Title');
    expect(screen.getByText('CAP-1')).toBeInTheDocument();
    expect(screen.getByText('SOP-1')).toBeInTheDocument();
  });

  it('saves an empty related_documents array when there is no extraction and no body Related section', async () => {
    const api = makeFakeApi();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<RecordIntake api={api} blueprint={capBlueprint} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Owner *'), { target: { value: 'Jane' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ related_documents: [] }),
        expect.any(String)
      )
    );
  });

  it('catches a bare inline id in the body even outside a "## Related" section', async () => {
    const api = makeFakeApi();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<RecordIntake api={api} blueprint={capBlueprint} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('Body'), {
      target: { value: 'Mentions INC-20260731-001 in passing, no heading at all.' },
    });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ related_documents: ['INC-20260731-001'] }),
        expect.any(String)
      )
    );
    expect(api.extract).not.toHaveBeenCalled();
  });
});

describe('RecordIntake - auto-tag on save', () => {
  it('merges vocabulary tags matched in the title/body into fields.tags without an Extract click', async () => {
    const api = makeFakeApi();
    vi.spyOn(relatedRecords, 'fetchTagVocabulary').mockResolvedValue(['calibration', 'audit']);
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <RecordIntake
        api={api}
        blueprint={capBlueprint}
        onSave={onSave}
        initialTitle="Calibration event"
      />
    );

    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Nothing tag-worthy here.' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ tags: expect.arrayContaining(['calibration']) }),
        expect.any(String)
      )
    );
    const savedFields = onSave.mock.calls[0][0];
    expect(savedFields.tags).not.toContain('audit');
  });
});
