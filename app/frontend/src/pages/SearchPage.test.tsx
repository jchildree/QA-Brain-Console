import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchPage } from './SearchPage';

describe('SearchPage', () => {
  it('renders a heading and not-yet-available message', () => {
    render(<SearchPage />);
    expect(screen.getByRole('heading', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByText(/not yet available/i)).toBeInTheDocument();
  });
});
