import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DynamicForm } from './DynamicForm';
import type { BlueprintField } from '../blueprint/sopBlueprint';
import * as relatedRecords from '../api/relatedRecords';

const blueprint: BlueprintField[] = [
  { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Approved'], required: true },
  { key: 'owner', label: 'Owner', type: 'text', required: true },
  { key: 'tags', label: 'Tags', type: 'tags' },
];

beforeEach(() => {
  vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockResolvedValue([
    { value: 'SOP-1', label: 'SOP: SOP-1' },
    { value: 'CAP-1', label: 'CAP: CAP-1' },
  ]);
});

describe('DynamicForm', () => {
  it('renders a labeled input per blueprint field', () => {
    render(<DynamicForm blueprint={blueprint} values={{}} onChange={vi.fn()} />);
    expect(screen.getByText('Status *')).toBeInTheDocument();
    expect(screen.getByText('Owner *')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('calls onChange with the field key and new value for a text field', () => {
    const onChange = vi.fn();
    render(<DynamicForm blueprint={blueprint} values={{}} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Owner *'), { target: { value: 'Jane Doe' } });
    expect(onChange).toHaveBeenCalledWith('owner', 'Jane Doe');
  });

  it('calls onChange with the selected value for a select field', () => {
    const onChange = vi.fn();
    render(<DynamicForm blueprint={blueprint} values={{}} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Status *'), { target: { value: 'Approved' } });
    expect(onChange).toHaveBeenCalledWith('status', 'Approved');
  });

  it('splits a comma-separated tags input into an array', () => {
    const onChange = vi.fn();
    render(<DynamicForm blueprint={blueprint} values={{}} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'a, b, c' } });
    expect(onChange).toHaveBeenCalledWith('tags', ['a', 'b', 'c']);
  });

  it('renders a multi-select of cross-type record options for a related field', async () => {
    const onChange = vi.fn();
    const relatedBlueprint: BlueprintField[] = [
      { key: 'related_documents', label: 'Related Documents', type: 'related' },
    ];
    render(<DynamicForm blueprint={relatedBlueprint} values={{}} onChange={onChange} />);

    await waitFor(() => expect(screen.getByText('SOP: SOP-1')).toBeInTheDocument());
    expect(screen.getByText('CAP: CAP-1')).toBeInTheDocument();

    const select = screen.getByLabelText('Related Documents') as HTMLSelectElement;
    (screen.getByText('SOP: SOP-1') as HTMLOptionElement).selected = true;
    fireEvent.change(select);
    expect(onChange).toHaveBeenCalledWith('related_documents', ['SOP-1']);
  });
});
