import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecordDashboard } from './RecordDashboard';

const FIXED_NOW = new Date('2026-07-15T00:00:00Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

function makeFakeApi(records: any[]) {
  return {
    list: vi.fn().mockResolvedValue(records),
    get: vi.fn(),
    save: vi.fn(),
    create: vi.fn(),
    extract: vi.fn(),
    remove: vi.fn().mockResolvedValue(undefined),
  } as any;
}

describe('RecordDashboard', () => {
  it('groups records into controlled, overdue, in-draft-or-review, and obsolete sections', async () => {
    const api = makeFakeApi([
      { id: 'CAP-1', status: 'Approved', version: '1.0', department: 'QA', review_date: '2026-01-01', owner: 'Jane', filename: 'CAP-1.md' },
      { id: 'CAP-2', status: 'Draft', version: '1.0', department: 'QA', review_date: '2027-01-01', owner: 'Jane', filename: 'CAP-2.md' },
      { id: 'CAP-3', status: 'Obsolete', version: '1.0', department: 'QC', review_date: '2025-01-01', owner: 'Jane', filename: 'CAP-3.md' },
    ]);

    render(
      <MemoryRouter>
        <RecordDashboard api={api} title="CAP" type="cap" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('All Controlled CAPs (2)')).toBeInTheDocument());
    expect(screen.getByText('Overdue for Review (1)')).toBeInTheDocument();
    expect(screen.getByText('In Draft / Review (1)')).toBeInTheDocument();
    expect(screen.getByText('Obsolete CAPs (1)')).toBeInTheDocument();
  });

  it('shows an error message when the fetch fails', async () => {
    const api = makeFakeApi([]);
    api.list.mockRejectedValue(new Error('Failed to load cap records'));

    render(
      <MemoryRouter>
        <RecordDashboard api={api} title="CAP" type="cap" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Failed to load cap records'));
  });

  it('removes a record from view after its delete button is clicked', async () => {
    const api = makeFakeApi([
      { id: 'CAP-1', status: 'Draft', version: '1.0', department: 'QA', review_date: '2027-01-01', owner: 'Jane', filename: 'CAP-1.md' },
    ]);

    render(
      <MemoryRouter>
        <RecordDashboard api={api} title="CAP" type="cap" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getAllByText('CAP-1').length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByLabelText('Delete CAP-1')[0]);

    await waitFor(() => expect(api.remove).toHaveBeenCalledWith('CAP-1.md'));
    await waitFor(() => expect(screen.queryByText('CAP-1')).not.toBeInTheDocument());
  });

  it('hides the folder filter when no record has a folder set', async () => {
    const api = makeFakeApi([
      { id: 'CAP-1', status: 'Draft', version: '1.0', department: 'QA', review_date: '2027-01-01', owner: 'Jane', filename: 'CAP-1.md' },
    ]);

    render(
      <MemoryRouter>
        <RecordDashboard api={api} title="CAP" type="cap" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getAllByText('CAP-1').length).toBeGreaterThan(0));
    expect(screen.queryByLabelText('Folder')).not.toBeInTheDocument();
  });

  it('filters records by folder when records have one set', async () => {
    const api = makeFakeApi([
      { id: 'MTG-1', status: 'Draft', version: '1.0', department: 'QA', review_date: '2027-01-01', owner: 'Jane', filename: 'MTG-1.md', folder: 'Team A' },
      { id: 'MTG-2', status: 'Draft', version: '1.0', department: 'QA', review_date: '2027-01-01', owner: 'Jane', filename: 'MTG-2.md', folder: 'Team B' },
    ]);

    render(
      <MemoryRouter>
        <RecordDashboard api={api} title="Meeting Minute" type="meeting" />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getAllByText('MTG-1').length).toBeGreaterThan(0));
    expect(screen.getAllByText('MTG-2').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Folder'), { target: { value: 'Team A' } });

    await waitFor(() => expect(screen.queryByText('MTG-2')).not.toBeInTheDocument());
    expect(screen.getAllByText('MTG-1').length).toBeGreaterThan(0);
  });
});
