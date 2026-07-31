import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DynamicForm } from './DynamicForm';
import type { BlueprintField } from '../blueprint/sopBlueprint';
import * as relatedRecords from '../api/relatedRecords';
import * as client from '../api/client';

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

  it('offers known record ids as autocomplete suggestions for a related field, without restricting entry to them', async () => {
    const onChange = vi.fn();
    const relatedBlueprint: BlueprintField[] = [
      { key: 'related_documents', label: 'Related Documents', type: 'related' },
    ];
    render(<DynamicForm blueprint={relatedBlueprint} values={{}} onChange={onChange} />);

    await waitFor(() => expect(screen.getByText('SOP: SOP-1')).toBeInTheDocument());
    expect(screen.getByText('CAP: CAP-1')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Related Documents'), { target: { value: 'SOP-1, SOP-NOT-YET-CREATED-002' } });
    expect(onChange).toHaveBeenCalledWith('related_documents', ['SOP-1', 'SOP-NOT-YET-CREATED-002']);
  });

  it('renders a single-select of active usernames for a user field', async () => {
    vi.spyOn(client, 'listActiveUsernames').mockResolvedValue(['alice', 'bob']);
    const onChange = vi.fn();
    const userBlueprint: BlueprintField[] = [{ key: 'assigned_to', label: 'Assigned To', type: 'user' }];
    render(<DynamicForm blueprint={userBlueprint} values={{}} onChange={onChange} />);

    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());
    expect(screen.getByText('bob')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Assigned To'), { target: { value: 'alice' } });
    expect(onChange).toHaveBeenCalledWith('assigned_to', 'alice');
  });

  it('offers known usernames as autocomplete for an owner field, but accepts a name that is not one of them', async () => {
    vi.spyOn(client, 'listActiveUsernames').mockResolvedValue(['alice', 'bob']);
    const onChange = vi.fn();
    const ownerBlueprint: BlueprintField[] = [{ key: 'owner', label: 'Owner', type: 'owner', required: true }];
    const { container } = render(<DynamicForm blueprint={ownerBlueprint} values={{}} onChange={onChange} />);

    await waitFor(() => expect(container.querySelectorAll('datalist option')).toHaveLength(2));
    expect(container.querySelector('datalist option[value="bob"]')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Owner *'), { target: { value: 'Someone Not In The System' } });
    expect(onChange).toHaveBeenCalledWith('owner', 'Someone Not In The System');
  });
});
