# Audit: RelatedRecordsGraph & RelatedDocumentsPicker Null/Missing Record Handling

**Wave:** 5 (after related-records-graph-resilience, Wave 4 -- appends to its RelatedRecordsGraph.test.tsx rather than recreating it)
**Consumes:** RelatedRecordsGraph.test.tsx (Wave 4, related-records-graph-resilience) -- append test cases, do not overwrite
**Produces:** dedup fixes to mergeRelated / RelatedRecordsGraph rendering
**Owns exclusively:** app/frontend/src/components/RelatedRecordsGraph.tsx, app/frontend/src/api/relatedRecords.ts (dedup logic), relatedRecords.test.ts, DynamicForm.test.tsx

**Goal:** Audit and fix edge cases in RelatedRecordsGraph and RelatedDocumentsPicker components where null, missing, empty, or non-existent record IDs could cause UI failures or inconsistent rendering.

**Context:**
- RelatedRecordsGraph (line 36–161) visualizes a record's related documents as a directed graph, filtering related_documents for strings and fetching titles from a cache (fetchAllRecordOptions).
- RelatedDocumentsPicker (line 19–96 in DynamicForm.tsx) allows users to add record IDs via autocomplete or free-text entry, displaying chips with fallback titles.
- Both components depend on fetchAllRecordOptions(), which can fail silently or return an incomplete cache.
- mergeRelated (relatedRecords.ts) merges body-parsed wikilinks into related_documents on save, but has no explicit duplicate filtering.
- Current test coverage does not include edge cases: empty arrays, non-existent IDs, rapid duplicate entry, fetch failures, null/undefined frontmatter fields.

**Scope:** Three files, ~8 small code changes, ~20 new test cases. No new dependencies or architecture changes.

---

## Step-by-Step Tasks

### Phase 1: Audit Existing Code (30 min)

**1.1 RelatedRecordsGraph edge case review**
- Read: `app/frontend/src/components/RelatedRecordsGraph.tsx` (line 36–161)
- Check:
  - Line 39–40: Filter for strings only — handles null/undefined ✓
  - Line 39: Empty `related_documents` array → graph returns "No linked records" (line 68–75) ✓
  - Line 56–58: fetchAllRecordOptions catch → `titles` set to `{}`, graph still renders with ID fallback (line 154–155) ✓
  - Line 154–155: `titles[id] ?? id` fallback handles undefined titles ✓
  - **Issue found:** No duplicate filtering on `outgoing` array (line 77 widest calculation uses raw length)
  - **Issue found:** If `record.related_documents` contains duplicates, they render twice in the graph

**1.2 RelatedDocumentsPicker edge case review**
- Read: `app/frontend/src/components/DynamicForm.tsx` (line 19–96)
- Check:
  - Line 41–44: `add()` checks `!value.includes(id)` — prevents duplicate entry ✓
  - Line 47: `titleFor(id)` falls back to `id` if not in options ✓
  - Line 36–38: fetchAllRecordOptions catch → `options` set to `[]`, picker still functional ✓
  - **Issue found:** No validation that free-typed IDs actually exist in the vault
  - **Issue found:** No explicit test for rapid/concurrent duplicate attempts

**1.3 mergeRelated edge case review**
- Read: `app/frontend/src/api/relatedRecords.ts` (line 73–78)
- Check:
  - Line 74: Filters existing for strings ✓
  - Line 75–76: Prevents duplicates vs existing ✓
  - **Issue found:** No de-duplication within `parsed` array itself — if parseRelatedSection returns `['SOP-1', 'SOP-1', 'CAP-2']`, they all get added

**1.4 RecordEditor merge flow review**
- Read: `app/frontend/src/components/RecordEditor.tsx` (line 59–84)
- Check:
  - Line 70: Calls parseRelatedSection and mergeRelated on save ✓
  - No validation that merged IDs are valid
  - Comment at line 65–67 is clear on intention ✓

**1.5 Test coverage audit**
- Check: `app/frontend/src/components/DynamicForm.test.tsx` — no edge cases for:
  - Empty related_documents array
  - Fetch failure + picker still works
  - Non-existent ID display
  - Rapid duplicate entry
- Check: `app/frontend/src/api/relatedRecords.test.ts` — no edge cases for:
  - Duplicate IDs within parsed array
  - null/undefined input to mergeRelated
  - Empty strings in parsed array

---

### Phase 2: Code Fixes (45 min)

**2.1 Add duplicate filtering to RelatedRecordsGraph**
- File: `app/frontend/src/components/RelatedRecordsGraph.tsx`
- Change: Line 39–40, filter for uniqueness in addition to string check
- From:
  ```typescript
  const outgoing = Array.isArray(record.related_documents)
    ? (record.related_documents as unknown[]).filter((d): d is string => typeof d === 'string' && d.trim() !== '')
    : [];
  ```
- To:
  ```typescript
  const outgoing = Array.isArray(record.related_documents)
    ? Array.from(new Set(
        (record.related_documents as unknown[]).filter((d): d is string => typeof d === 'string' && d.trim() !== '')
      ))
    : [];
  ```
- Rationale: Prevents double-rendering if related_documents contains duplicates (edge case from merging or manual editing).

**2.2 Add duplicate filtering to mergeRelated**
- File: `app/frontend/src/api/relatedRecords.ts`
- Change: Line 73–78, de-duplicate parsed array before merging
- From:
  ```typescript
  export function mergeRelated(existing: unknown, parsed: string[]): string[] {
    const base = Array.isArray(existing) ? existing.filter((x): x is string => typeof x === 'string') : [];
    const out = [...base];
    for (const id of parsed) if (!out.includes(id)) out.push(id);
    return out;
  }
  ```
- To:
  ```typescript
  export function mergeRelated(existing: unknown, parsed: string[]): string[] {
    const base = Array.isArray(existing) ? existing.filter((x): x is string => typeof x === 'string') : [];
    const uniqueParsed = Array.from(new Set(parsed.filter((p): p is string => typeof p === 'string' && p.trim() !== '')));
    const out = [...base];
    for (const id of uniqueParsed) if (!out.includes(id)) out.push(id);
    return out;
  }
  ```
- Rationale: De-duplication at the source (merge function) is safer than relying on each caller to catch duplicates.

**2.3 Verify RecordEditor handles edge cases**
- File: `app/frontend/src/components/RecordEditor.tsx`
- Check: Line 70 — mergeRelated is called with parseRelatedSection result, which now filters empty strings, so no action needed.
- Verify: Line 55–56 in DynamicForm render branch (line 197–202) passes [] (not undefined) for missing related_documents.
- Action: No change needed; the chain is safe.

---

### Phase 3: Test Coverage (1 hour)

**3.1 Extend relatedRecords.test.ts**
- File: `app/frontend/src/api/relatedRecords.test.ts`
- Add test suite: `describe('mergeRelated edge cases', ...)`
  - Test: Duplicate IDs in parsed array are de-duplicated
    ```typescript
    expect(mergeRelated([], ['SOP-1', 'SOP-1', 'CAP-2', 'CAP-2'])).toEqual(['SOP-1', 'CAP-2']);
    ```
  - Test: Empty strings in parsed array are filtered
    ```typescript
    expect(mergeRelated([], ['SOP-1', '', 'CAP-2', '   '])).toEqual(['SOP-1', 'CAP-2']);
    ```
  - Test: null/undefined existing is treated as []
    ```typescript
    expect(mergeRelated(null, ['SOP-1'])).toEqual(['SOP-1']);
    expect(mergeRelated(undefined, ['SOP-1'])).toEqual(['SOP-1']);
    ```
  - Test: Non-string values in existing are filtered
    ```typescript
    expect(mergeRelated(['SOP-1', 123, null, 'CAP-2'], ['INC-1'])).toEqual(['SOP-1', 'CAP-2', 'INC-1']);
    ```
  - Test: Preserves order (existing first, then new parsed)
    ```typescript
    expect(mergeRelated(['CAP-1', 'SOP-1'], ['INC-1', 'CAP-1', 'AUD-1'])).toEqual(['CAP-1', 'SOP-1', 'INC-1', 'AUD-1']);
    ```

**3.2 Extend DynamicForm.test.tsx**
- File: `app/frontend/src/components/DynamicForm.test.tsx`
- Add test suite: `describe('RelatedDocumentsPicker edge cases', ...)`
  - Test: Empty initial related_documents renders no chips
    ```typescript
    render(<DynamicForm blueprint={[relatedField]} values={{ related_documents: [] }} onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
    ```
  - Test: Null/undefined related_documents is treated as empty array
    ```typescript
    render(<DynamicForm blueprint={[relatedField]} values={{ related_documents: null }} onChange={onChange} />);
    render(<DynamicForm blueprint={[relatedField]} values={{ related_documents: undefined }} onChange={onChange} />);
    // Both should render input, no chips
    ```
  - Test: Non-existent ID shows as chip with ID as label (no title found)
    ```typescript
    render(<DynamicForm blueprint={[relatedField]} values={{ related_documents: ['NOT-A-REAL-ID'] }} onChange={vi.fn()} />);
    expect(screen.getByText('NOT-A-REAL-ID')).toBeInTheDocument();
    ```
  - Test: Fetching options fails gracefully — picker still functional
    ```typescript
    vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockRejectedValue(new Error('Network error'));
    // ... picker should still render and accept free-text input
    ```
  - Test: Rapid duplicate entry is prevented
    ```typescript
    const input = screen.getByLabelText('Related Documents');
    fireEvent.change(input, { target: { value: 'SOP-1' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.change(input, { target: { value: 'SOP-1' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    // onChange called only once with ['SOP-1']
    expect(onChange).toHaveBeenLastCalledWith('related_documents', ['SOP-1']);
    ```
  - Test: Chip title shows cached title if available, falls back to ID
    ```typescript
    render(<DynamicForm blueprint={[relatedField]} values={{ related_documents: ['SOP-1', 'MISSING-ID'] }} onChange={vi.fn()} />);
    expect(screen.getByText('SOP-1')).toBeInTheDocument(); // cached title
    expect(screen.getByText('MISSING-ID')).toBeInTheDocument(); // fallback to ID
    ```

**3.3 Add RelatedRecordsGraph edge case tests**
- File: Create `app/frontend/src/components/RelatedRecordsGraph.test.tsx` (new file)
- Add test suite: `describe('RelatedRecordsGraph edge cases', ...)`
  - Test: Empty related_documents renders "No linked records"
    ```typescript
    render(<RelatedRecordsGraph record={{ id: 'TEST-1', title: 'Test', related_documents: [] }} />);
    expect(screen.getByText('No linked records')).toBeInTheDocument();
    ```
  - Test: null related_documents is treated as empty array
    ```typescript
    render(<RelatedRecordsGraph record={{ id: 'TEST-1', title: 'Test', related_documents: null }} />);
    expect(screen.getByText('No linked records')).toBeInTheDocument();
    ```
  - Test: Undefined related_documents renders "No linked records"
    ```typescript
    const record = { id: 'TEST-1', title: 'Test' }; // related_documents omitted
    render(<RelatedRecordsGraph record={record} />);
    expect(screen.getByText('No linked records')).toBeInTheDocument();
    ```
  - Test: Non-string values in related_documents are filtered
    ```typescript
    render(<RelatedRecordsGraph record={{ id: 'TEST-1', title: 'Test', related_documents: ['SOP-1', null, 123, 'CAP-1'] }} />);
    // Should only render 2 nodes (SOP-1, CAP-1)
    expect(screen.getByText('SOP-1')).toBeInTheDocument();
    expect(screen.getByText('CAP-1')).toBeInTheDocument();
    ```
  - Test: Duplicate IDs render only once
    ```typescript
    render(<RelatedRecordsGraph record={{ id: 'TEST-1', title: 'Test', related_documents: ['SOP-1', 'SOP-1', 'CAP-1'] }} />);
    const nodes = screen.getAllByText('SOP-1');
    expect(nodes).toHaveLength(1); // only one instance
    ```
  - Test: Titles map failure (empty cache) renders node labels as IDs
    ```typescript
    vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockResolvedValue([]);
    render(<RelatedRecordsGraph record={{ id: 'TEST-1', title: 'Test', related_documents: ['SOP-1', 'CAP-1'] }} />);
    await waitFor(() => {
      expect(screen.getByText('SOP-1')).toBeInTheDocument(); // fallback to ID
      expect(screen.getByText('CAP-1')).toBeInTheDocument();
    });
    ```
  - Test: Null/undefined record.id uses fallback "this record"
    ```typescript
    render(<RelatedRecordsGraph record={{ id: null, title: 'Test', related_documents: ['SOP-1'] }} />);
    // Should not crash; centerTitle falls back to centerId ("this record")
    expect(screen.getByText('No linked records')).not.toBeInTheDocument(); // one outgoing link
    ```
  - Test: Null/undefined record.title uses record.id
    ```typescript
    render(<RelatedRecordsGraph record={{ id: 'TEST-1', title: null, related_documents: [] }} />);
    expect(screen.getByText('TEST-1')).toBeInTheDocument(); // center node label
    ```

---

### Phase 4: Verification (30 min)

**4.1 Run all tests**
- Command: `npm test -- app/frontend/src/{components,api}/{DynamicForm,RelatedRecordsGraph,relatedRecords}`
- Expected: All new tests pass, no regressions.

**4.2 Manual smoke test in the app**
1. Create or edit a Note with empty related_documents → graph shows "No linked records" ✓
2. Add a real SOP ID and a fake ID to related_documents → picker shows both, graph shows both with fallback title for fake ✓
3. Add the same ID twice in quick succession → only one chip added ✓
4. Add IDs via body "## Related" section and save → merge deduplicates on save ✓
5. Kill network before loading a record editor → picker loads without options, still accepts free-text ✓

**4.3 Code review checklist**
- [ ] No new dependencies added
- [ ] All edge cases (null/undefined/empty) are explicitly tested
- [ ] Fallback labels are used consistently (ID when title missing)
- [ ] De-duplication happens at the right layer (input validation layer for picker, array processing for merge)
- [ ] Error handling does not break UI (silent failures with graceful degradation)
- [ ] Tests are readable and document the expected behavior

**4.4 Document findings**
- Any crashes found → root cause and fix
- Any UI inconsistencies → expected behavior and fix
- Any test failures → reason and remediation

---

## Files to Modify

1. `app/frontend/src/components/RelatedRecordsGraph.tsx` — add de-duplication (1 line change)
2. `app/frontend/src/api/relatedRecords.ts` — add de-duplication to mergeRelated (2 lines change)
3. `app/frontend/src/components/DynamicForm.test.tsx` — add ~10 new test cases
4. `app/frontend/src/api/relatedRecords.test.ts` — add ~6 new test cases
5. `app/frontend/src/components/RelatedRecordsGraph.test.tsx` — new file with ~8 test cases

---

## Expected Outcome

- RelatedRecordsGraph and RelatedDocumentsPicker handle all edge cases (null/undefined/empty/non-existent/duplicate IDs) gracefully
- Graph displays correct node count even if related_documents has duplicates
- Picker prevents duplicate entry even with rapid user input
- mergeRelated deduplicates at source, not downstream
- Test coverage includes 20+ edge cases covering all nullability/emptiness scenarios
- No UI crashes or broken renders when records are missing or cache fails
- All existing tests still pass

---

## Ponytail Notes

- De-duplication uses `Set` (stdlib) — no new dependencies.
- Degrade gracefully on cache miss: IDs render as fallback labels, UI stays functional.
- No over-engineering: only fix the duplicates issue + add tests. No validation layer, no "missing record" indicator UI.
- Root cause: mergeRelated and graph rendering didn't account for duplicates or empty values. Fix at source (merge function and initial filter), not in every caller.
