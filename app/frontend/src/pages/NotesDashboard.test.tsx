import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotesDashboard } from './NotesDashboard';
import { AuthContext } from '../context/AuthContext';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

const NOTES = [
  { id: 'NOTE-1', title: 'Calibration drift', folder: 'Meetings', tags: ['qc'], filename: 'NOTE-1.md', assigned_to: 'alice' },
  { id: 'NOTE-2', title: 'Onboarding checklist', folder: 'Reference', tags: [], filename: 'NOTE-2.md', assigned_to: 'bob' },
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

  it('filters to notes assigned to the current user', async () => {
    (fetch as any).mockResolvedValue({ ok: true, json: async () => NOTES });

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{ username: 'alice', role: 'user', isAdmin: false, logout: vi.fn() }}>
          <NotesDashboard />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    await screen.findByText('Calibration drift');
    fireEvent.click(screen.getByLabelText('Assigned to me'));

    expect(screen.getByText('Calibration drift')).toBeInTheDocument();
    expect(screen.queryByText('Onboarding checklist')).not.toBeInTheDocument();
  });
});
