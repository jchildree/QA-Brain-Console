import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EvidenceLibraryPage } from './EvidenceLibraryPage';
import * as client from '../api/client';

describe('EvidenceLibraryPage', () => {
  it('lists every attachment with a link back to its owning record', async () => {
    vi.spyOn(client, 'listEvidence').mockResolvedValue([
      { type: 'cap', urlSlug: 'cap', recordFilename: 'CAP-1.md', attachmentFilename: 'note.txt' },
      { type: 'sop', urlSlug: 'sops', recordFilename: 'SOP-1.md', attachmentFilename: 'photo.jpg' },
    ]);

    render(
      <MemoryRouter>
        <EvidenceLibraryPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('note.txt')).toBeInTheDocument());
    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    expect(screen.getByText('CAP-1.md')).toHaveAttribute('href', '/cap/CAP-1.md');
    expect(screen.getByText('SOP-1.md')).toHaveAttribute('href', '/sop/SOP-1.md');
  });

  it('shows a message when there are no attachments', async () => {
    vi.spyOn(client, 'listEvidence').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <EvidenceLibraryPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/no evidence/i)).toBeInTheDocument();
  });
});
