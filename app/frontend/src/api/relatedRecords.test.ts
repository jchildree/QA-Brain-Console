import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseRelatedSection,
  mergeRelated,
  parseInlineIds,
  suggestTags,
  fetchTagVocabulary,
  resetTagVocabularyCache,
} from './relatedRecords';

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

// The wikilink-brace strip is `/\[\[|\]\]/g` -- it removes every literal "[["
// or "]]" pair it finds anywhere in the line, not just a matched outer pair.
// These cases document the actual (sometimes surprising) output rather than
// an idealized wikilink parser.
describe('parseRelatedSection - malformed wikilinks', () => {
  it('strips a lone unclosed "[[" opener', () => {
    // "[[SOP-1" contains one "[[" pair, which is removed in full.
    expect(parseRelatedSection('## Related\n[[SOP-1')).toEqual(['SOP-1']);
  });

  it('strips a lone unclosed "]]" closer', () => {
    expect(parseRelatedSection('## Related\nSOP-1]]')).toEqual(['SOP-1']);
  });

  it('leaves single (non-doubled) brackets untouched', () => {
    // "[SOP-1]" has no "[[" or "]]" substring, so nothing is stripped.
    expect(parseRelatedSection('## Related\n[SOP-1]')).toEqual(['[SOP-1]']);
  });

  it('strips one brace pair from mixed "[[SOP-1]"', () => {
    // Only the leading "[[" matches; the single trailing "]" is left as-is.
    expect(parseRelatedSection('## Related\n[[SOP-1]')).toEqual(['SOP-1]']);
  });

  it('strips the outer pair from triple brackets, leaving one on each side', () => {
    // "[[[SOP-1]]]": greedy /g match consumes "[[" then "]]" once each,
    // leaving one leftover "[" and "]".
    expect(parseRelatedSection('## Related\n[[[SOP-1]]]')).toEqual(['[SOP-1]']);
  });

  it('strips both pairs from quadruple brackets, leaving none', () => {
    expect(parseRelatedSection('## Related\n[[[[SOP-1]]]]')).toEqual(['SOP-1']);
  });

  it('leaves internal single brackets inside the id untouched', () => {
    expect(parseRelatedSection('## Related\n[[SOP[20260101]001]]')).toEqual([
      'SOP[20260101]001',
    ]);
  });

  it('does not strip brackets separated by backslashes (not literal "[[")', () => {
    expect(parseRelatedSection('## Related\n\\[\\[SOP-1\\]\\]')).toEqual([
      '\\[\\[SOP-1\\]\\]',
    ]);
  });
});

// No format/pattern validation happens on the extracted ids at all -- any
// non-empty string survives. These document that lack of validation.
describe('parseRelatedSection - invalid ID patterns', () => {
  it('passes through a bare UUID unchanged', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(parseRelatedSection(`## Related\n${uuid}`)).toEqual([uuid]);
  });

  it('passes through an id with an invalid date (month 91)', () => {
    expect(parseRelatedSection('## Related\nSOP-20269101-001')).toEqual([
      'SOP-20269101-001',
    ]);
  });

  it('passes through underscores instead of dashes', () => {
    expect(parseRelatedSection('## Related\nSOP_20260101_001')).toEqual([
      'SOP_20260101_001',
    ]);
  });

  it('passes through a partial id missing date and seq', () => {
    expect(parseRelatedSection('## Related\nSOP-2026')).toEqual(['SOP-2026']);
  });

  it('passes through a type not in the TYPES list', () => {
    expect(parseRelatedSection('## Related\nUNKNOWN-20260101-001')).toEqual([
      'UNKNOWN-20260101-001',
    ]);
  });

  it('passes through a lowercase type unchanged', () => {
    expect(parseRelatedSection('## Related\nsop-20260101-001')).toEqual([
      'sop-20260101-001',
    ]);
  });
});

describe('parseRelatedSection - null/undefined/empty', () => {
  it('returns [] for null input', () => {
    expect(parseRelatedSection(null as unknown as string)).toEqual([]);
  });

  it('returns [] for undefined input', () => {
    expect(parseRelatedSection(undefined as unknown as string)).toEqual([]);
  });

  it('returns [] for an empty string', () => {
    expect(parseRelatedSection('')).toEqual([]);
  });

  it('returns [] for a whitespace-only string', () => {
    expect(parseRelatedSection('   \n  \t  ')).toEqual([]);
  });

  it('returns [] for a Related heading with no body lines', () => {
    expect(parseRelatedSection('## Related\n')).toEqual([]);
  });

  it('skips blank list items but keeps the rest', () => {
    expect(parseRelatedSection('## Related\n- \n\n- SOP-1')).toEqual(['SOP-1']);
  });

  it('skips whitespace-only lines but keeps the rest', () => {
    expect(parseRelatedSection('## Related\n   \n- SOP-1')).toEqual(['SOP-1']);
  });
});

describe('mergeRelated - null/undefined/empty', () => {
  it('treats a null existing value as no existing ids', () => {
    expect(mergeRelated(null, ['SOP-1'])).toEqual(['SOP-1']);
  });

  it('treats an undefined existing value as no existing ids', () => {
    expect(mergeRelated(undefined, ['SOP-1'])).toEqual(['SOP-1']);
  });

  it('handles an empty existing array', () => {
    expect(mergeRelated([], ['SOP-1'])).toEqual(['SOP-1']);
  });

  it('handles an empty parsed array', () => {
    expect(mergeRelated(['SOP-1'], [])).toEqual(['SOP-1']);
  });

  it('returns [] when both are empty', () => {
    expect(mergeRelated([], [])).toEqual([]);
  });
});

describe('mergeRelated - type safety', () => {
  it('filters null out of the existing array', () => {
    expect(mergeRelated(['SOP-1', null, 'CAP-2'], ['INC-3'])).toEqual([
      'SOP-1',
      'CAP-2',
      'INC-3',
    ]);
  });

  it('filters undefined out of the existing array', () => {
    expect(mergeRelated(['SOP-1', undefined, 'CAP-2'], ['INC-3'])).toEqual([
      'SOP-1',
      'CAP-2',
      'INC-3',
    ]);
  });

  it('filters a number out of the existing array', () => {
    expect(mergeRelated(['SOP-1', 123, 'CAP-2'], ['INC-3'])).toEqual([
      'SOP-1',
      'CAP-2',
      'INC-3',
    ]);
  });

  it('keeps an empty string in the existing array (still a string)', () => {
    expect(mergeRelated(['SOP-1', '', 'CAP-2'], [])).toEqual(['SOP-1', '', 'CAP-2']);
  });

  it('treats a non-array existing value (plain object) as empty', () => {
    expect(mergeRelated({ id: 'SOP-1' }, ['CAP-2'])).toEqual(['CAP-2']);
  });
});

describe('mergeRelated - order and deduplication', () => {
  it('deduplicates repeats within the parsed array', () => {
    expect(mergeRelated([], ['SOP-1', 'SOP-1', 'CAP-2'])).toEqual(['SOP-1', 'CAP-2']);
  });

  it('filters empty and whitespace-only strings out of the parsed array', () => {
    expect(mergeRelated([], ['SOP-1', '', 'CAP-2', '   '])).toEqual(['SOP-1', 'CAP-2']);
  });

  it('does not re-add an id already present in existing', () => {
    expect(mergeRelated(['SOP-1', 'CAP-2'], ['CAP-2', 'INC-3'])).toEqual([
      'SOP-1',
      'CAP-2',
      'INC-3',
    ]);
  });

  it('preserves the existing array order', () => {
    expect(mergeRelated(['Z-1', 'A-1'], ['B-1'])).toEqual(['Z-1', 'A-1', 'B-1']);
  });

  it('preserves the parsed array insertion order', () => {
    expect(mergeRelated([], ['Z-1', 'A-1', 'B-1'])).toEqual(['Z-1', 'A-1', 'B-1']);
  });

  it('treats differently-cased ids as distinct (no case normalization)', () => {
    expect(mergeRelated(['SOP-1'], ['sop-1'])).toEqual(['SOP-1', 'sop-1']);
  });

  it('keeps first-occurrence order across repeated parsed duplicates', () => {
    expect(mergeRelated(['A'], ['A', 'B', 'A', 'C', 'B'])).toEqual(['A', 'B', 'C']);
  });
});

describe('parseRelatedSection - heading edge cases', () => {
  it('ignores "related" appearing mid-line, not as a heading', () => {
    expect(parseRelatedSection('Some related text\nSOP-1')).toEqual([]);
  });

  it('does not recognize fenced code blocks -- fence markers are collected as ids and a nested "## Related" heading is treated as a real heading', () => {
    // Known limitation: parseRelatedSection has no fence-awareness. The ```
    // lines aren't headings, so they're collected as ids like anything else,
    // and the nested "## Related" line is just another (redundant) heading
    // that keeps the section active.
    expect(
      parseRelatedSection('## Related\n```\n## Related\nSOP-1\n```\nCAP-2')
    ).toEqual(['```', 'SOP-1', '```', 'CAP-2']);
  });

  it('stops the first Related section at the next heading, ignoring a later Related section start', () => {
    expect(
      parseRelatedSection('## Related\nSOP-1\n## Other\n## Related\nCAP-2')
    ).toEqual(['SOP-1', 'CAP-2']);
  });

  it('activates on a heading that starts with "Related" plus trailing words', () => {
    expect(parseRelatedSection('## Related Documents\nSOP-1')).toEqual(['SOP-1']);
  });
});

describe('parseInlineIds', () => {
  it('finds a bare id anywhere in the text, not just under a Related heading', () => {
    expect(parseInlineIds('See INC-20260731-001 for details.')).toEqual(['INC-20260731-001']);
  });

  it('finds an id wrapped in [[wikilink]] braces', () => {
    expect(parseInlineIds('Linked to [[SOP-20260101-001]] above.')).toEqual(['SOP-20260101-001']);
  });

  it('collects multiple distinct ids, deduped, in first-seen order', () => {
    expect(parseInlineIds('CAP-20260101-001 then INC-20260101-002 then CAP-20260101-001 again')).toEqual([
      'CAP-20260101-001',
      'INC-20260101-002',
    ]);
  });

  it('dedupes an id mentioned both inline and inside a "## Related" section', () => {
    const body = 'Refer to SOP-20260101-001 in the intro.\n## Related\n- SOP-20260101-001';
    expect(parseInlineIds(body)).toEqual(['SOP-20260101-001']);
  });

  it('does not match near-miss strings with the wrong segment lengths or an unlisted prefix', () => {
    expect(parseInlineIds('SOP-2026-001 XYZ-20260101-001 SOP-202601011-001')).toEqual([]);
  });

  it('returns [] for text with no ids', () => {
    expect(parseInlineIds('nothing to see here')).toEqual([]);
  });
});

describe('suggestTags', () => {
  it('matches vocabulary tags case-insensitively', () => {
    expect(suggestTags('We found a Calibration drift.', ['calibration'])).toEqual(['calibration']);
  });

  it('only matches on word boundaries, not inside a longer word', () => {
    expect(suggestTags('recalibrationists met today', ['calibration'])).toEqual([]);
  });

  it('escapes regex-special characters in a tag before matching', () => {
    expect(suggestTags('Uses a pH+ sensor for this batch.', ['pH+'])).toEqual(['pH+']);
  });

  it('returns [] for an empty vocabulary', () => {
    expect(suggestTags('any text at all', [])).toEqual([]);
  });

  it('returns only the vocabulary entries actually mentioned in the text', () => {
    expect(suggestTags('calibration and audit both mentioned', ['calibration', 'audit', 'training'])).toEqual([
      'calibration',
      'audit',
    ]);
  });
});

describe('fetchTagVocabulary', () => {
  beforeEach(() => {
    resetTagVocabularyCache();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: 'X-1', tags: ['calibration', 'audit'] }, { id: 'X-2', tags: ['calibration'] }],
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('collects and dedupes tags across every record type', async () => {
    const vocab = await fetchTagVocabulary();
    expect(vocab).toEqual(expect.arrayContaining(['calibration', 'audit']));
    expect(new Set(vocab).size).toBe(vocab.length);
  });

  it('caches the result across calls until reset', async () => {
    await fetchTagVocabulary();
    await fetchTagVocabulary();
    // 8 record types fetched once each, not twice.
    expect((fetch as any).mock.calls.length).toBe(8);
  });
});
