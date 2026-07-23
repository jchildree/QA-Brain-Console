import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EvidenceLibraryPage } from './EvidenceLibraryPage';

describe('EvidenceLibraryPage', () => {
  it('renders a heading and not-yet-available message', () => {
    render(<EvidenceLibraryPage />);
    expect(screen.getByRole('heading', { name: 'Evidence Library' })).toBeInTheDocument();
    expect(screen.getByText(/not yet available/i)).toBeInTheDocument();
  });
});
