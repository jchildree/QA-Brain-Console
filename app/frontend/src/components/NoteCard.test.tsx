import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NoteCard } from './NoteCard';
import type { RecordSummary } from '../api/client';

function makeRecord(overrides: Partial<RecordSummary> = {}): RecordSummary {
  return {
    id: 'NOTE-20260101-001',
    status: '',
    version: '',
    department: '',
    review_date: '',
    owner: '',
    filename: 'NOTE-20260101-001.md',
    title: 'Meeting follow-up',
    folder: 'Projects',
    tags: ['tag1', 'tag2'],
    ...overrides,
  };
}

function renderCard(record: RecordSummary, onDelete = vi.fn()) {
  const utils = render(
    <MemoryRouter>
      <NoteCard record={record} onDelete={onDelete} />
    </MemoryRouter>
  );
  return { ...utils, onDelete };
}

describe('NoteCard', () => {
  it('renders a complete note with title, folder, and tags', () => {
    const record = makeRecord();
    renderCard(record);
    expect(screen.getByText('Meeting follow-up')).toBeInTheDocument();
    expect(screen.getByText('Projects · NOTE-20260101-001')).toBeInTheDocument();
    expect(screen.getByText('tag1, tag2')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/notes/NOTE-20260101-001.md');
  });

  it('falls back to record.id when title is missing', () => {
    renderCard(makeRecord({ title: '' }));
    expect(screen.getAllByText('NOTE-20260101-001').length).toBeGreaterThan(0);
  });

  it('renders just the id in card-type when folder is missing', () => {
    renderCard(makeRecord({ folder: null as unknown as string }));
    expect(screen.getByText('NOTE-20260101-001')).toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });

  it('does not render card-desc when tags are empty or missing', () => {
    const cases: Array<RecordSummary['tags']> = [null as any, [], undefined as any];
    cases.forEach((tags) => {
      const { container } = renderCard(makeRecord({ tags }));
      expect(container.querySelector('.card-desc')).not.toBeInTheDocument();
    });
  });

  it('filters out non-string tags', () => {
    renderCard(makeRecord({ tags: ['tag1', null, 'tag2', undefined, 123, 'tag3'] as any }));
    expect(screen.getByText('tag1, tag2, tag3')).toBeInTheDocument();
  });

  it('filters out empty-string and whitespace-only tags', () => {
    renderCard(makeRecord({ tags: ['tag1', '', 'tag2', '   '] }));
    expect(screen.getByText('tag1, tag2')).toBeInTheDocument();
  });

  it('renders a long folder name without breaking', () => {
    const longFolder = 'A'.repeat(60);
    renderCard(makeRecord({ folder: longFolder }));
    expect(screen.getByText(`${longFolder} · NOTE-20260101-001`)).toBeInTheDocument();
  });

  it('joins multiple tags with ", "', () => {
    renderCard(makeRecord({ tags: ['alpha', 'beta', 'gamma'] }));
    expect(screen.getByText('alpha, beta, gamma')).toBeInTheDocument();
  });

  it('calls onDelete with the filename when the delete button is clicked, without navigating', () => {
    const onDelete = vi.fn();
    const record = makeRecord();
    renderCard(record, onDelete);

    const btn = screen.getByLabelText(`Delete ${record.id}`);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefault = vi.spyOn(click, 'preventDefault');
    btn.dispatchEvent(click);

    expect(preventDefault).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledWith(record.filename);
  });

  it('renders the Link with the correct href', () => {
    const record = makeRecord({ filename: 'NOTE-20260101-999.md' });
    renderCard(record);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/notes/NOTE-20260101-999.md');
  });
});
