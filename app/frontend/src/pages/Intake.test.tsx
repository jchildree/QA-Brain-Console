import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Intake } from './Intake';
import * as client from '../api/client';

beforeEach(() => {
  vi.spyOn(client, 'extractFromText').mockResolvedValue({ department: 'QC', tags: ['calibration'], purpose: 'p', scope: 's' });
});

describe('Intake', () => {
  it('extracts fields from pasted raw text and pre-fills the form', async () => {
    render(<Intake />);

    fireEvent.change(screen.getByLabelText('Raw notes'), { target: { value: 'Calibrate the pH meter every shift.' } });
    fireEvent.click(screen.getByText('Extract'));

    await waitFor(() => expect(client.extractFromText).toHaveBeenCalledWith('Calibrate the pH meter every shift.'));
    await waitFor(() => expect(screen.getByLabelText('Department *')).toHaveValue('QC'));
  });

  it('disables Extract until raw text is entered', () => {
    render(<Intake />);
    expect(screen.getByText('Extract')).toBeDisabled();
  });
});
