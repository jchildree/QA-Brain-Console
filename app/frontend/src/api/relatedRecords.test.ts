import { describe, it, expect } from 'vitest';
import { parseRelatedSection, mergeRelated } from './relatedRecords';

describe('parseRelatedSection', () => {
  it('collects each row under a Related heading until the next heading', () => {
    const body = [
      '# Note',
      'intro text',
      '## Related',
      '- [[SOP-20260101-001]]',
      '- CAP-20260101-002',
      'INC-20260101-003',
      '',
      '## Next Section',
      '- NOT-RELATED-999',
    ].join('\n');

    expect(parseRelatedSection(body)).toEqual([
      'SOP-20260101-001',
      'CAP-20260101-002',
      'INC-20260101-003',
    ]);
  });

  it('is case-insensitive on the heading and returns [] when absent', () => {
    expect(parseRelatedSection('### related\nSOP-1')).toEqual(['SOP-1']);
    expect(parseRelatedSection('no section here')).toEqual([]);
  });
});

describe('mergeRelated', () => {
  it('appends parsed ids to existing without duplicates', () => {
    expect(mergeRelated(['SOP-1'], ['SOP-1', 'CAP-2'])).toEqual(['SOP-1', 'CAP-2']);
    expect(mergeRelated(undefined, ['CAP-2'])).toEqual(['CAP-2']);
  });
});
