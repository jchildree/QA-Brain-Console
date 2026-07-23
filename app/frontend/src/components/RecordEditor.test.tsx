import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RecordEditor } from './RecordEditor';
import { capBlueprint } from '../blueprint/capBlueprint';
import * as relatedRecords from '../api/relatedRecords';

beforeEach(() => {
  vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockResolvedValue([]);
});

function makeFakeApi() {
  return {
    list: vi.fn(),
    get: vi.fn().mockResolvedValue({
      filename: 'CAP-1.md',
      frontmatter: { status: 'Draft', version: '1.0', owner: 'Jane', department: 'QA', review_date: '2026-01-01', tags: [], root_cause: '', effectiveness_status: 'Pending' },
      body: '# Existing body\n',
    }),
    save: vi.fn().mockResolvedValue(undefined),
    create: vi.fn(),
    extract: vi.fn(),
  } as any;
}

describe('RecordEditor', () => {
  it('loads the record and pre-fills the form and body textarea', async () => {
    const api = makeFakeApi();
    render(<RecordEditor api={api} blueprint={capBlueprint} filename="CAP-1.md" />);
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));
    expect(screen.getByLabelText('Body')).toHaveValue('# Existing body\n');
  });

  it('saves edited frontmatter and body on submit', async () => {
    const api = makeFakeApi();
    render(<RecordEditor api={api} blueprint={capBlueprint} filename="CAP-1.md" />);
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));

    fireEvent.change(screen.getByLabelText('Owner *'), { target: { value: 'New Owner' } });
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: '# Updated body\n' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(api.save).toHaveBeenCalledWith(
        'CAP-1.md',
        expect.objectContaining({ owner: 'New Owner' }),
        '# Updated body\n'
      )
    );
  });
});
