import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RecordIntake } from './RecordIntake';
import { capBlueprint } from '../blueprint/capBlueprint';

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
});
