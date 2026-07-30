import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findBacklinks } from './backlinks';
import { TYPES } from './relatedRecords';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

function mockListResponses(byType: Record<string, unknown[]>) {
  (fetch as any).mockImplementation((url: string) => {
    const entry = TYPES.find(({ urlSlug }) => url.endsWith(`/${urlSlug}`));
    return Promise.resolve({ ok: true, json: async () => (entry ? byType[entry.type] ?? [] : []) });
  });
}

describe('findBacklinks', () => {
  it('returns records across types whose related_documents includes the target id', async () => {
    mockListResponses({
      cap: [{ id: 'CAP-1', filename: 'CAP-1.md', related_documents: ['SOP-1'] }],
      incident: [{ id: 'INC-1', filename: 'INC-1.md', related_documents: ['SOP-2'] }],
      notes: [{ id: 'NOTE-1', filename: 'NOTE-1.md', related_documents: ['SOP-1'] }],
    });

    const result = await findBacklinks('SOP-1');

    expect(result).toEqual([
      { type: 'cap', id: 'CAP-1', filename: 'CAP-1.md' },
      { type: 'notes', id: 'NOTE-1', filename: 'NOTE-1.md' },
    ]);
  });

  it('returns an empty array when nothing references the target id', async () => {
    mockListResponses({ cap: [{ id: 'CAP-1', filename: 'CAP-1.md', related_documents: [] }] });
    expect(await findBacklinks('SOP-1')).toEqual([]);
  });

  it('ignores records with no related_documents field', async () => {
    mockListResponses({ cap: [{ id: 'CAP-1', filename: 'CAP-1.md' }] });
    expect(await findBacklinks('SOP-1')).toEqual([]);
  });
});
