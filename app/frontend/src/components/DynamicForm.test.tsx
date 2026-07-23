import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DynamicForm } from './DynamicForm';
import type { BlueprintField } from '../blueprint/sopBlueprint';

const blueprint: BlueprintField[] = [
  { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Approved'], required: true },
  { key: 'owner', label: 'Owner', type: 'text', required: true },
  { key: 'tags', label: 'Tags', type: 'tags' },
];

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
});
