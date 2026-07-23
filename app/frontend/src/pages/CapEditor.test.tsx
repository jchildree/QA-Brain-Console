import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CapEditor } from './CapEditor';
import * as relatedRecords from '../api/relatedRecords';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockResolvedValue([]);
});

describe('CapEditor', () => {
  it('loads a CAP record from /api/cap and pre-fills CAP-specific fields', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        filename: 'CAP-1.md',
        frontmatter: { status: 'Draft', version: '1.0', owner: 'Jane', department: 'QA', review_date: '2026-01-01', tags: [], root_cause: 'Root note', effectiveness_status: 'Pending' },
        body: '# Existing body\n',
      }),
    });

    render(<CapEditor filename="CAP-1.md" />);

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/cap/CAP-1.md', { credentials: 'include' }));
    expect(await screen.findByLabelText('Root Cause')).toHaveValue('Root note');
  });

  it('saves via PUT /api/cap/:filename', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        filename: 'CAP-1.md',
        frontmatter: { status: 'Draft', version: '1.0', owner: 'Jane', department: 'QA', review_date: '2026-01-01', tags: [], root_cause: '', effectiveness_status: 'Pending' },
        body: '# Existing body\n',
      }),
    });
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });

    render(<CapEditor filename="CAP-1.md" />);
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));

    fireEvent.change(screen.getByLabelText('Root Cause'), { target: { value: 'New cause' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/cap/CAP-1.md',
        expect.objectContaining({ method: 'PUT' })
      )
    );
  });
});
