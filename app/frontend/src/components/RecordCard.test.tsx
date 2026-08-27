import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecordCard } from './RecordCard';
import type { RecordSummary } from '../api/client';

function makeRecord(overrides: Partial<RecordSummary> = {}): RecordSummary {
  return {
    id: 'CAP-20260101-001',
    status: 'Approved',
    version: '1.0',
    department: 'QA',
    review_date: '2026-12-01',
    owner: 'Jane Doe',
    filename: 'CAP-20260101-001.md',
    title: 'Root cause fix',
    root_cause: 'Machine drift',
    ...overrides,
  };
}

function renderCard(record: RecordSummary, extra: { type?: string; typeLabel?: string; onDelete?: (f: string) => void } = {}) {
  return render(
    <MemoryRouter>
      <RecordCard
        record={record}
        type={extra.type ?? 'cap'}
        typeLabel={extra.typeLabel ?? 'CAP'}
        linkTo={`/cap/${record.filename}`}
        onDelete={extra.onDelete}
      />
    </MemoryRouter>
  );
}

describe('RecordCard', () => {
  it('renders a complete, valid record', () => {
    const record = makeRecord();
    renderCard(record);
    expect(screen.getByText('Root cause fix')).toBeInTheDocument();
    expect(screen.getByText('CAP · CAP-20260101-001')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Review due 2026-12-01')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Machine drift')).toBeInTheDocument();
  });

  it('falls back to record.id when title is missing', () => {
    const record = makeRecord({ title: '' });
    renderCard(record);
    expect(screen.getByText('CAP-20260101-001')).toBeInTheDocument();
  });

  it('renders "Unassigned" when owner is empty or undefined', () => {
    renderCard(makeRecord({ owner: '' }));
    expect(screen.getByText('Unassigned')).toBeInTheDocument();

    renderCard(makeRecord({ owner: undefined as unknown as string }));
    expect(screen.getAllByText('Unassigned').length).toBeGreaterThan(0);
  });

  it('renders "—" when review_date is empty or undefined', () => {
    renderCard(makeRecord({ review_date: '' }));
    expect(screen.getByText('Review due —')).toBeInTheDocument();

    renderCard(makeRecord({ review_date: undefined as unknown as string }));
    expect(screen.getAllByText('Review due —').length).toBeGreaterThan(0);
  });

  it('renders a non-standard status without crashing', () => {
    renderCard(makeRecord({ status: 'Aproved' }));
    expect(screen.getByText('Aproved')).toBeInTheDocument();
  });

  it('does not render a description when the expected field is missing', () => {
    const { container } = renderCard(makeRecord({ root_cause: undefined }));
    expect(container.querySelector('.card-desc')).not.toBeInTheDocument();
  });

  it('uses DEFAULT_STAMP when typeLabel is unknown', () => {
    const { container } = renderCard(makeRecord(), { typeLabel: 'UnknownType' });
    expect(container.querySelector('.stamp')).toBeInTheDocument();
    expect(screen.getByText('UnknownType · CAP-20260101-001')).toBeInTheDocument();
  });

  it('renders all required parts with fallbacks when optional fields are missing', () => {
    const record: RecordSummary = {
      id: 'CAP-20260101-002',
      status: '',
      version: '1.0',
      department: 'QA',
      review_date: '',
      owner: '',
      filename: 'CAP-20260101-002.md',
    };
    renderCard(record);
    expect(screen.getByText('CAP-20260101-002')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('Review due —')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('does not pick up unrelated fields like related_documents in the description', () => {
    const record = makeRecord({ root_cause: '', related_documents: ['SOP-1'] });
    const { container } = renderCard(record);
    expect(container.querySelector('.card-desc')).not.toBeInTheDocument();
  });

  it('calls onDelete with the filename when the delete button is clicked, without navigating', () => {
    const onDelete = vi.fn();
    const record = makeRecord();
    renderCard(record, { onDelete });

    const btn = screen.getByLabelText(`Delete ${record.id}`);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(click, 'preventDefault');
    btn.dispatchEvent(click);

    expect(preventDefault).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledWith(record.filename);
  });
});
