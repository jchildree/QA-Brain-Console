import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TrashPage } from './TrashPage';

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

beforeEach(() => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('TrashPage', () => {
  it('lists trashed records with a readable type label', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse([{ id: 'INC-20260101-001', status: 'Draft', filename: 'INC-20260101-001.md' }])),
    );

    render(<TrashPage />);

    await waitFor(() => expect(screen.getByText('INC-20260101-001')).toBeInTheDocument());
    expect(screen.getByText('Incident')).toBeInTheDocument();
  });

  it('shows a message when trash is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));

    render(<TrashPage />);

    expect(await screen.findByText(/trash is empty/i)).toBeInTheDocument();
  });

  it('restores a record and removes it from the list', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ id: 'INC-20260101-001', status: 'Draft', filename: 'INC-20260101-001.md' }]))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    render(<TrashPage />);

    await waitFor(() => expect(screen.getByText('INC-20260101-001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Restore'));

    await waitFor(() => expect(screen.queryByText('INC-20260101-001')).not.toBeInTheDocument());
    expect(fetchMock.mock.calls[1][0]).toContain('/trash/INC-20260101-001.md/restore');
  });

  it('permanently deletes a record after confirmation', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ id: 'INC-20260101-001', status: 'Draft', filename: 'INC-20260101-001.md' }]))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    render(<TrashPage />);

    await waitFor(() => expect(screen.getByText('INC-20260101-001')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Permanently Delete'));

    await waitFor(() => expect(screen.queryByText('INC-20260101-001')).not.toBeInTheDocument());
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'DELETE' });
  });
});
