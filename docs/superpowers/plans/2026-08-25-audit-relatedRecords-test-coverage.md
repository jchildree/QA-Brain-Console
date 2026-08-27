# Audit parseRelatedSection & mergeRelated: Test Coverage and Edge Cases

**Wave:** 1 (parallel with backend-audit-stabilization, vault-dashboard-audit, card-component-rendering-edge-cases)
**Consumes:** none (relatedRecords.ts read-only)
**Produces:** test coverage for parseRelatedSection/mergeRelated
**Owns exclusively:** app/frontend/src/api/relatedRecords.test.ts

## Goal

Extend `app/frontend/src/api/relatedRecords.test.ts` from 2 tests to comprehensive edge-case coverage for `parseRelatedSection()` and `mergeRelated()`. Verify both functions handle malformed input, type safety issues, and boundary conditions correctly.

## Context

**Current state:**
- `relatedRecords.ts` contains two functions (~25 lines total):
  - `parseRelatedSection(text: string): string[]` — parses markdown, finds "Related" heading, extracts IDs until next heading
  - `mergeRelated(existing: unknown, parsed: string[]): string[]` — merges two ID lists with deduplication
- Test file has only 2 tests covering happy paths
- Functions are used to parse freeform markdown notes and merge related documents

**No validation occurs** on the IDs themselves — the functions accept any non-whitespace string after stripping list markers and wikilink braces. Invalid IDs (e.g., malformed patterns, non-existent records) pass through silently.

**Parsing strategy:**
- Looks for line matching `/^\s*#{1,6}\s+(.*\S)\s*$/` (heading)
- Activates parsing on case-insensitive match to `^related\b`
- Strips list markers (`-`, `*`, `+`, `1.` etc.) and wikilink braces `[[` `]]` via regex
- Collects each non-empty line until next heading or EOF

## Step-by-Step Tasks

### 1. Test Malformed Wikilinks (8 cases)

File: `app/frontend/src/api/relatedRecords.test.ts`

Add a new `describe('parseRelatedSection - malformed wikilinks')` block with tests for:

1. **Unclosed opening bracket** — `[[SOP-1` should extract `[SOP-1` (the regex `/\[\[|\]\]/g` won't match, so `[[` remains)
2. **Unclosed closing bracket** — `SOP-1]]` should extract `SOP-1` (closing `]]` is stripped, opening not present)
3. **Asymmetric brackets** — `[SOP-1]` should extract `[SOP-1]` (single brackets aren't wikilinks, left as-is)
4. **Mixed types** — `[[SOP-1]` should extract `[SOP-1` (one brace pair removed)
5. **Double opening** — `[[[SOP-1]]]` should extract `[SOP-1]` (two outer pairs removed)
6. **Nested structure** — `[[[[SOP-1]]]]` should extract `[[SOP-1]]` (all four braces removed in pairs)
7. **Brace in ID** — `[[SOP[20260101]001]]` should extract `SOP[20260101]001` (internal brackets untouched)
8. **Escaped-like syntax** — `\[\[SOP-1\]\]` should extract `\[\[SOP-1\]\]` (backslashes not special in regex)

Expected behavior: current regex strips `[[` and `]]` everywhere; this test validates that behavior (or documents breaking changes if regex is tightened).

**Pseudo-code test stub:**
```js
describe('parseRelatedSection - malformed wikilinks', () => {
  it('extracts from unclosed [[SOP-1', () => {
    expect(parseRelatedSection('## Related\n[[SOP-1')).toEqual(['[SOP-1']);
  });
  it('extracts from SOP-1]] with closing brace', () => {
    expect(parseRelatedSection('## Related\nSOP-1]]')).toEqual(['SOP-1']);
  });
  // ... 6 more similar
});
```

### 2. Test Invalid ID Patterns (6 cases)

File: `app/frontend/src/api/relatedRecords.test.ts`

Add `describe('parseRelatedSection - invalid ID patterns')`:

1. **Bare UUID** — `550e8400-e29b-41d4-a716-446655440000` (UUID, not `TYPE-YYYYMMDD-seq`)
2. **Typo in date** — `SOP-20269101-001` (month 91, invalid)
3. **Wrong delimiter** — `SOP_20260101_001` (underscores instead of dashes)
4. **Partial ID** — `SOP-2026` (missing date and seq)
5. **Type mismatch** — `UNKNOWN-20260101-001` (type not in TYPES list — still passes through)
6. **All caps vs mixed** — `sop-20260101-001` (lowercase type — passes as-is, doesn't match "SOP")

Expected behavior: document that **no validation happens**. The functions accept any string. This test establishes that malformed IDs are not filtered.

**Pseudo-code:**
```js
describe('parseRelatedSection - invalid ID patterns', () => {
  it('passes through UUID-like strings unchanged', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(parseRelatedSection(`## Related\n${uuid}`)).toEqual([uuid]);
  });
  // ... 5 more (all expecting IDs to pass through unfiltered)
});
```

### 3. Test Null/Undefined/Empty Inputs (7 cases)

File: `app/frontend/src/api/relatedRecords.test.ts`

Add `describe('parseRelatedSection - null/undefined/empty')`:

1. **null input** — `parseRelatedSection(null)` should return `[]` (line 53 has `?? ''` fallback)
2. **undefined input** — `parseRelatedSection(undefined)` should return `[]`
3. **Empty string** — `parseRelatedSection('')` should return `[]`
4. **Whitespace-only string** — `parseRelatedSection('   \n  \t  ')` should return `[]`
5. **Empty Related section** — `parseRelatedSection('## Related\n')` should return `[]`
6. **Empty line in section** — `parseRelatedSection('## Related\n- \n\n- SOP-1')` should return `['SOP-1']` (empty items skipped)
7. **Whitespace-only line in section** — `parseRelatedSection('## Related\n   \n- SOP-1')` should return `['SOP-1']`

For `mergeRelated`:

8. **null existing** — `mergeRelated(null, ['SOP-1'])` should return `['SOP-1']`
9. **undefined existing** — `mergeRelated(undefined, ['SOP-1'])` should return `['SOP-1']` (already tested)
10. **Empty existing array** — `mergeRelated([], ['SOP-1'])` should return `['SOP-1']`
11. **Empty parsed array** — `mergeRelated(['SOP-1'], [])` should return `['SOP-1']`
12. **Both empty** — `mergeRelated([], [])` should return `[]`

**Pseudo-code:**
```js
describe('parseRelatedSection - null/undefined/empty', () => {
  it('returns [] for null input', () => {
    expect(parseRelatedSection(null)).toEqual([]);
  });
  it('returns [] for undefined input', () => {
    expect(parseRelatedSection(undefined)).toEqual([]);
  });
  // ... more
});

describe('mergeRelated - null/undefined/empty', () => {
  it('handles null existing', () => {
    expect(mergeRelated(null, ['SOP-1'])).toEqual(['SOP-1']);
  });
  // ... more
});
```

### 4. Test Type Safety and Non-String Elements (5 cases)

File: `app/frontend/src/api/relatedRecords.test.ts`

Add `describe('mergeRelated - type safety')`:

1. **existing contains null** — `mergeRelated(['SOP-1', null, 'CAP-2'], ['INC-3'])` should filter out null and return `['SOP-1', 'CAP-2', 'INC-3']` (line 74 does this)
2. **existing contains undefined** — `mergeRelated(['SOP-1', undefined, 'CAP-2'], ['INC-3'])` should filter and return `['SOP-1', 'CAP-2', 'INC-3']`
3. **existing contains number** — `mergeRelated(['SOP-1', 123, 'CAP-2'], ['INC-3'])` should filter and return `['SOP-1', 'CAP-2', 'INC-3']`
4. **existing contains empty string** — `mergeRelated(['SOP-1', '', 'CAP-2'], [])` should keep empty string (it's still a string) and return `['SOP-1', '', 'CAP-2']`
5. **existing is plain object** — `mergeRelated({ id: 'SOP-1' }, ['CAP-2'])` should return `['CAP-2']` (object is not an array, filtered by line 74)

**Pseudo-code:**
```js
describe('mergeRelated - type safety', () => {
  it('filters null from existing array', () => {
    expect(mergeRelated(['SOP-1', null, 'CAP-2'], ['INC-3'])).toEqual(['SOP-1', 'CAP-2', 'INC-3']);
  });
  it('filters number from existing array', () => {
    expect(mergeRelated(['SOP-1', 123, 'CAP-2'], [])).toEqual(['SOP-1', 'CAP-2']);
  });
  // ... 3 more
});
```

### 5. Test Order Preservation and Deduplication Edge Cases (6 cases)

File: `app/frontend/src/api/relatedRecords.test.ts`

Add `describe('mergeRelated - order and deduplication')`:

1. **Duplicate in parsed array** — `mergeRelated([], ['SOP-1', 'SOP-1', 'CAP-2'])` should return `['SOP-1', 'CAP-2']` (only first occurrence kept; current implementation uses `includes()` check, so second `SOP-1` is skipped)
2. **Duplicate across existing and parsed** — `mergeRelated(['SOP-1', 'CAP-2'], ['CAP-2', 'INC-3'])` should return `['SOP-1', 'CAP-2', 'INC-3']` (CAP-2 not re-added)
3. **Existing order preserved** — `mergeRelated(['Z-1', 'A-1'], ['B-1'])` should return `['Z-1', 'A-1', 'B-1']` (existing order unchanged)
4. **Parsed order preserved** — `mergeRelated([], ['Z-1', 'A-1', 'B-1'])` should return `['Z-1', 'A-1', 'B-1']` (insertion order)
5. **Case sensitivity in deduplication** — `mergeRelated(['SOP-1'], ['sop-1'])` should return `['SOP-1', 'sop-1']` (strings compared as-is, not case-normalized)
6. **Multiple duplicates in parsed** — `mergeRelated(['A'], ['A', 'B', 'A', 'C', 'B'])` should return `['A', 'B', 'C']` (early duplicates in parsed skipped, order of first occurrence preserved)

**Pseudo-code:**
```js
describe('mergeRelated - order and deduplication', () => {
  it('deduplicates within parsed array', () => {
    expect(mergeRelated([], ['SOP-1', 'SOP-1', 'CAP-2'])).toEqual(['SOP-1', 'CAP-2']);
  });
  it('preserves case in deduplication', () => {
    expect(mergeRelated(['SOP-1'], ['sop-1'])).toEqual(['SOP-1', 'sop-1']);
  });
  // ... 4 more
});
```

### 6. Test Heading Edge Cases (4 cases)

File: `app/frontend/src/api/relatedRecords.test.ts`

Add `describe('parseRelatedSection - heading edge cases')`:

1. **"Related" mid-line** — `parseRelatedSection('Some related text\nSOP-1')` should return `[]` (doesn't match heading regex)
2. **"Related" in code block** — `parseRelatedSection('## Related\n```\n## Related\nSOP-1\n```\nCAP-2')` should return... (note: current implementation doesn't track code blocks, so it will wrongly activate on the nested heading; this test documents the limitation or motivates a fix)
3. **Multiple "Related" sections** — `parseRelatedSection('## Related\nSOP-1\n## Other\n## Related\nCAP-2')` should return `['SOP-1']` (only first "Related" section parsed until next heading)
4. **Related with trailing content in heading** — `parseRelatedSection('## Related Documents')` should activate and parse (regex is `/^related\b/i`, so "Related D..." matches)

**Pseudo-code:**
```js
describe('parseRelatedSection - heading edge cases', () => {
  it('ignores "Related" not in a heading', () => {
    expect(parseRelatedSection('Some related text\nSOP-1')).toEqual([]);
  });
  it('parses only until next heading', () => {
    expect(parseRelatedSection('## Related\nSOP-1\n## Other\n## Related\nCAP-2')).toEqual(['SOP-1']);
  });
  // ... 2 more
});
```

## Verification Steps

After writing all tests, **run the test suite**:

```bash
cd app/frontend
npm run test -- relatedRecords.test.ts
```

**Verify all 31 new tests pass** (2 existing + 29 new):
- 8 malformed wikilinks
- 6 invalid ID patterns
- 12 null/undefined/empty (7 for parseRelatedSection, 5 for mergeRelated)
- 5 type safety
- 6 order/deduplication
- 4 heading edge cases

**Code coverage check:**
- Confirm both `parseRelatedSection()` and `mergeRelated()` have >95% line coverage
- All branches in the heading regex and list-marker strip should be exercised

**No changes to implementation** — this audit is test-only. If implementation bugs are discovered (e.g., code-block blindness in heading detection), document them as separate ADRs or issues, don't fix in this pass.

## Files Affected

- `app/frontend/src/api/relatedRecords.test.ts` — only file modified (add 29+ test cases)
- `app/frontend/src/api/relatedRecords.ts` — read-only (audit only)

## Acceptance Criteria

1. All 31+ tests in the file pass
2. Test names and descriptions clearly explain edge case being tested
3. No changes to `relatedRecords.ts` (audit only)
4. Coverage report shows 100% line coverage on both functions
5. Tests document discovered limitations (e.g., code-block unawareness) as comments, not fixes
