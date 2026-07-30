import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotesDashboard } from './NotesDashboard';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

const NOTES = [
  { id: 'NOTE-1', title: 'Calibration drift', folder: 'Meetings', tags: ['qc'], filename: 'NOTE-1.md' },
  { id: 'NOTE-2', title: 'Onboarding checklist', folder: 'Reference', tags: [], filename: 'NOTE-2.md' },
];

describe('NotesDashboard', () => {
  it('lists notes from the /api/notes base URL', async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => NOTES });

    render(
      <MemoryRouter>
        <NotesDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/notes', { credentials: 'include' }));
    expect(await screen.findByText('Calibration drift')).toBeInTheDocument();
    expect(screen.getByText('Onboarding checklist')).toBeInTheDocument();
  });

  it('filters by folder', async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => NOTES });

    render(
      <MemoryRouter>
        <NotesDashboard />
      </MemoryRouter>
    );

    await screen.findByText('Calibration drift');
    fireEvent.change(screen.getByLabelText('Folder'), { target: { value: 'Reference' } });

    expect(screen.queryByText('Calibration drift')).not.toBeInTheDocument();
    expect(screen.getByText('Onboarding checklist')).toBeInTheDocument();
  });

  it('filters by search text', async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => NOTES });

    render(
      <MemoryRouter>
        <NotesDashboard />
      </MemoryRouter>
    );

    await screen.findByText('Calibration drift');
    fireEvent.change(screen.getByLabelText('Search Notes'), { target: { value: 'onboarding' } });

    expect(screen.queryByText('Calibration drift')).not.toBeInTheDocument();
    expect(screen.getByText('Onboarding checklist')).toBeInTheDocument();
  });
});
