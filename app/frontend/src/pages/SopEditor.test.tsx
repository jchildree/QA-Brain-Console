import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SopEditor } from './SopEditor';
import * as client from '../api/client';

beforeEach(() => {
  vi.spyOn(client, 'getSop').mockResolvedValue({
    filename: 'SOP-1.md',
    frontmatter: { status: 'Draft', version: '1.0', owner: 'Jane', department: 'QA', review_date: '2026-01-01', tags: [] },
    body: '# Existing body\n',
  });
  vi.spyOn(client, 'saveSop').mockResolvedValue(undefined);
});

describe('SopEditor', () => {
  it('loads the SOP and pre-fills the form and body textarea', async () => {
    render(<SopEditor filename="SOP-1.md" />);
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));
    expect(screen.getByLabelText('Body')).toHaveValue('# Existing body\n');
  });

  it('saves edited frontmatter and body on submit', async () => {
    render(<SopEditor filename="SOP-1.md" />);
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));

    fireEvent.change(screen.getByLabelText('Owner *'), { target: { value: 'New Owner' } });
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: '# Updated body\n' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(client.saveSop).toHaveBeenCalledWith(
        'SOP-1.md',
        expect.objectContaining({ owner: 'New Owner' }),
        '# Updated body\n'
      )
    );
  });
});
