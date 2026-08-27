# Card Component Rendering: RecordCard & NoteCard Edge Cases

**Wave:** 1 (parallel with backend-audit-stabilization, vault-dashboard-audit, audit-relatedRecords-test-coverage)
**Consumes:** none
**Produces:** null-safe RecordCard/NoteCard rendering
**Owns exclusively:** app/frontend/src/components/RecordCard.tsx, NoteCard.tsx, RecordCard.test.tsx, NoteCard.test.tsx, RecordDashboard.test.tsx

**Goal:** Fix null/empty field handling in RecordCard.tsx and NoteCard.tsx, create comprehensive test coverage (RecordCard.test.tsx and NoteCard.test.tsx), and verify the RecordDashboard's new uncategorized section doesn't break card rendering for non-standard status values.

**Context:** RecordCard and NoteCard lack defensive null checks and test coverage. RecordCard's `descriptionFor()` may silently fail when expected fields are missing; NoteCard renders folder and tags without prior validation. Both will render broken UI if passed partial/invalid RecordSummary objects. RecordDashboard recently added an "uncategorized" section (lines 209–216) to catch records with non-standard status values—this surfaces the need for robust card rendering. The project uses vitest + @testing-library/react; existing tests (AppShell.test.tsx, RecordDashboard.test.tsx) establish patterns for mocking and assertions.

---

## Tasks

### Task 1: Audit and fix RecordCard.tsx

**File:** `app/frontend/src/components/RecordCard.tsx`

**Audit checklist:**
1. `descriptionFor()` returns empty string if no matching field found (safe, but silent)
2. `record.title` is checked but only used as a fallback; if missing, renders `record.id` (safe)
3. `record.status` is rendered directly without validation—a non-standard status (e.g., typo "Aproved") will display as-is
4. `record.owner` is rendered without null/empty check (line 64: `Owner <b>{record.owner}</b>`)—will show "Owner <b>undefined</b>" or empty
5. `record.review_date` is rendered without null/empty check (line 66: `Review due {record.review_date}`)—will show "Review due undefined"
6. `stampClass[typeLabel]` uses DEFAULT_STAMP fallback if typeLabel is missing (safe)

**Fixes:**
1. Add null/empty checks for `record.owner` and `record.review_date`; render "—" or "Unassigned" if missing
2. Add optional chaining and type narrowing for `record.status` to avoid rendering invalid values; add a defensive check: if status is falsy or not in the controlled vocabulary, use a safe default or warn in dev console
3. Ensure `descriptionFor()` gracefully handles undefined fields in the DESCRIPTION_FIELDS map (it already does, but verify no type issues)

**Pattern:** Use inline conditional rendering or a helper function to check field presence before rendering. Example:
```typescript
const owner = typeof record.owner === 'string' && record.owner.trim() 
  ? record.owner 
  : 'Unassigned';
const reviewDue = typeof record.review_date === 'string' && record.review_date.trim() 
  ? record.review_date 
  : '—';
```

**Verification:**
- RecordCard renders without errors when passed `{ id, filename, status: 'Draft', version: '1.0', department: 'QA', review_date: '', owner: '', title: '', related_documents: [] }`
- RecordCard renders without errors when passed a record with `status: 'InvalidStatus'`
- Fallback values appear when fields are missing

---

### Task 2: Create RecordCard.test.tsx

**File:** `app/frontend/src/components/RecordCard.test.tsx` (new file)

**Test cases to cover:**

1. **Happy path:** RecordCard renders a complete, valid record with all fields populated
   - Verify title, id, typeLabel, owner, review_date, and status stamp are displayed
   - Verify description is shown when available (e.g., CAP with root_cause)

2. **Missing title:** RecordCard falls back to record.id when title is empty/missing
   - Pass `{ ...validRecord, title: '' }` and verify rendered title is the record.id

3. **Missing or empty owner:** RecordCard renders fallback ("Unassigned") when owner is missing/empty
   - Pass `{ ...validRecord, owner: '' }` and `{ ...validRecord, owner: undefined }`
   - Verify fallback text appears (not "Owner undefined" or "Owner ")

4. **Missing or empty review_date:** RecordCard renders fallback ("—") when review_date is missing/empty
   - Pass `{ ...validRecord, review_date: '' }` and similar
   - Verify fallback appears

5. **Invalid/non-standard status:** RecordCard renders the status value as-is (or with a safe fallback) and doesn't crash
   - Pass `{ ...validRecord, status: 'InvalidStatus' }` or `status: 'Aproved'` (typo)
   - Verify no console errors and rendering completes

6. **Missing description field:** RecordCard doesn't render a description when the expected field is missing
   - Pass a CAP without root_cause, or incident without description
   - Verify `.card-desc` is not rendered (or is empty)

7. **typeLabel not in stampClass:** RecordCard uses DEFAULT_STAMP when typeLabel is unknown
   - Pass `{ ...validRecord, typeLabel: 'UnknownType' }`
   - Verify no crash; DEFAULT_STAMP class is applied

8. **All optional fields missing:** RecordCard still renders all required parts (title/id, type, owner fallback, review_date fallback)
   - Pass a minimal record with only id, filename, status, version, department, review_date (all as empty/null except id/filename)
   - Verify complete render with fallbacks

9. **Null-coalescing in descriptionFor():** Verify it picks the first non-empty field from DESCRIPTION_FIELDS
   - For a Incident with empty description but non-empty related_documents, verify description is empty (not related_documents)
   - (Note: related_documents is not in DESCRIPTION_FIELDS, so this is a safety check)

10. **Delete button calls onDelete with correct filename when clicked**
    - Pass onDelete mock, click delete button, verify it was called with the filename
    - Verify event.preventDefault() and event.stopPropagation() are called (test by checking link is not navigated)

**Setup pattern:** Use MemoryRouter wrapper, mock onDelete with vi.fn(), create a factory for valid RecordSummary objects to avoid repetition.

**Verification:** All 10 test cases pass; no console errors or warnings.

---

### Task 3: Audit and fix NoteCard.tsx

**File:** `app/frontend/src/components/NoteCard.tsx`

**Audit checklist:**
1. `folder` is checked: `typeof record.folder === 'string' ? record.folder : ''` (safe, renders empty string if missing)
2. `tags` is checked: `Array.isArray(record.tags) ? (record.tags as string[]) : []` (safe, treats non-array as empty)
3. `record.title` is checked but the condition is `typeof record.title === 'string' && record.title`—this will fail if title is an empty string (intended), but will render the id if so (safe)
4. `record.filename` is used without validation in the Link href (safe, required field per RecordSummary)
5. `record.id` is used without validation in fallback and card-type (safe, required field)
6. Tags array is rendered as string with `.join(', ')` (safe if all elements are strings; however, type assertion `as string[]` may be masking invalid data)

**Fixes:**
1. Add a safety pass over tags array before rendering: filter out non-strings or falsy values
2. Verify folder string is not too long (add truncation or title attribute if needed—optional, but consider UX)
3. No breaking fixes needed; the component is already defensive. Consider adding a comment explaining the defensive checks.

**Pattern:** Keep the existing pattern (inline conditionals) but add a helper to filter tags:
```typescript
const safeTags = tags.filter((t) => typeof t === 'string' && t.trim());
```

**Verification:**
- NoteCard renders without errors when passed `{ id, filename, title: '', folder: null, tags: null }`
- NoteCard renders without errors when passed `{ ...validNote, tags: [null, '', 'tag1', undefined, 'tag2'] }`
- Only valid tag strings are displayed

---

### Task 4: Create NoteCard.test.tsx

**File:** `app/frontend/src/components/NoteCard.test.tsx` (new file)

**Test cases to cover:**

1. **Happy path:** NoteCard renders a complete note with title, folder, and tags
   - Verify title, id, folder, and tags are all displayed
   - Verify link href is correct (`/notes/${filename}`)

2. **Missing title:** NoteCard falls back to record.id when title is missing/empty
   - Pass `{ ...validNote, title: '' }` and verify id is displayed

3. **Missing folder:** NoteCard renders just the id in card-type (no "· " separator)
   - Pass `{ ...validNote, folder: null }` or `folder: ''`
   - Verify card-type shows only the id, not " · {id}"

4. **Missing or empty tags:** NoteCard doesn't render card-desc when tags array is empty/missing
   - Pass `{ ...validNote, tags: null }`, `tags: []`, `tags: undefined`
   - Verify card-desc is not rendered

5. **Tags with mixed types:** NoteCard filters out non-string tags (null, undefined, numbers) before rendering
   - Pass `{ ...validNote, tags: ['tag1', null, 'tag2', undefined, 123, 'tag3'] }`
   - Verify only `tag1, tag2, tag3` are displayed (non-strings and empty strings filtered out)

6. **Tags with empty strings:** NoteCard filters out empty-string tags
   - Pass `{ ...validNote, tags: ['tag1', '', 'tag2', '   '] }`
   - Verify only non-empty tags are displayed

7. **Long folder name:** NoteCard renders the full folder name (no truncation, but verify no layout break)
   - Pass a very long folder name (50+ chars)
   - Verify it renders without breaking the card layout

8. **Multiple tags:** NoteCard renders tags joined by ", "
   - Pass `tags: ['alpha', 'beta', 'gamma']`
   - Verify display is "alpha, beta, gamma"

9. **Delete button calls onDelete with correct filename when clicked**
   - Pass onDelete mock, click delete button, verify it was called with the filename
   - Verify event.preventDefault() and stopPropagation() work (link not navigated)

10. **Link navigation works** (basic sanity check)
    - Verify `<Link to={`/notes/${filename}`}>` renders with correct href
    - Does not navigate in test (MemoryRouter) but href is correct

**Setup pattern:** Use MemoryRouter wrapper, mock onDelete with vi.fn(), factory for valid NoteCard data.

**Verification:** All 10 test cases pass; no console errors or warnings.

---

### Task 5: Verify RecordDashboard uncategorized section with edge-case records

**File:** `app/frontend/src/components/RecordDashboard.test.tsx` (add new test)

**Test case:**

Add one test case to the existing RecordDashboard test suite to verify that records with non-standard status values render correctly in the uncategorized section without crashing or producing console errors.

**Test:**
```
it('renders uncategorized records with non-standard status in a separate section', async () => {
  const api = makeFakeApi([
    { id: 'CAP-1', status: 'Approved', version: '1.0', department: 'QA', review_date: '2026-01-01', owner: 'Jane', filename: 'CAP-1.md' },
    { id: 'CAP-2', status: 'NonStandardStatus', version: '1.0', department: 'QA', review_date: '2027-01-01', owner: 'Jane', filename: 'CAP-2.md' },
  ]);

  render(
    <MemoryRouter>
      <RecordDashboard api={api} title="CAP" type="cap" />
    </MemoryRouter>
  );

  await waitFor(() => expect(screen.getByText('Uncategorized (1)')).toBeInTheDocument());
  expect(screen.getByText('CAP-2')).toBeInTheDocument();
  // Verify the card rendered without errors (no console errors in test)
});
```

**Verification:** Test passes; no console errors when rendering the uncategorized section.

---

## Acceptance Criteria

1. **RecordCard.tsx fixes are applied:** null/empty checks added for owner and review_date; defensive status handling in place; descriptionFor() remains unchanged but verified
2. **RecordCard.test.tsx created:** 10 test cases cover happy path, all missing/invalid field scenarios, fallback values, and delete button behavior; all tests pass
3. **NoteCard.tsx fixes applied:** tags array is filtered to remove non-strings and empty values; no rendering crashes on invalid data
4. **NoteCard.test.tsx created:** 10 test cases cover happy path, missing folder/tags, mixed tag types, delete button; all tests pass
5. **RecordDashboard uncategorized test added:** One new test verifies uncategorized records render without crashing; test passes
6. **No regressions:** Existing tests (RecordDashboard.test.tsx, all component tests) still pass after changes
7. **Type safety:** TypeScript builds without new errors (RecordCard and NoteCard may already pass; verify after fixes)

---

## Testing / Verification Steps

1. **Run all frontend tests:**
   ```bash
   cd app/frontend
   npm run test
   ```
   Verify all tests pass, including the new RecordCard.test.tsx and NoteCard.test.tsx

2. **Check for console errors:**
   - Run the full test suite and capture any console.error or console.warn calls
   - Verify no warnings about missing props or undefined values

3. **Manual UI check (optional but recommended):**
   - Start the frontend dev server: `npm run dev` in `app/frontend/`
   - Navigate to a record dashboard (e.g., `/cap`, `/incident`)
   - Create or edit a record to have an empty owner field (if possible in UI, or mock in dev tools)
   - Verify card still renders with fallback value

4. **TypeScript check:**
   ```bash
   npm run type-check
   ```
   Verify no new type errors in RecordCard or NoteCard

5. **Diff review:**
   - Review the changes to RecordCard.tsx and NoteCard.tsx for defensiveness and readability
   - Verify fixes are minimal and don't introduce unnecessary abstraction

---

## Notes

- **Defensive coding over validation:** RecordCard and NoteCard receive data from a controlled backend API (RecordSummary type is the contract), so defensive null/empty checks are sufficient. No need to throw errors or add complex validation logic.
- **Fallback values:** Using "Unassigned" for owner and "—" for review_date are UX choices; if the design calls for different fallbacks, adjust accordingly.
- **descriptionFor():** This function already returns empty string safely; no changes needed. It's already defensive.
- **Related documents not in scope:** RecordSummary has a `[key: string]: unknown` catch-all, so `related_documents` may exist but is not rendered by RecordCard. This is intentional (not displayed in the card).
- **Uncategorized section:** The RecordDashboard fix is already in place (lines 209–216). The test addition confirms it works with edge-case records.
- **No new dependencies:** Uses existing test framework (vitest, @testing-library/react).

---

## Related Code References

- **RecordCard.tsx:** `app/frontend/src/components/RecordCard.tsx` (70 lines)
- **NoteCard.tsx:** `app/frontend/src/components/NoteCard.tsx` (36 lines)
- **RecordDashboard.tsx:** `app/frontend/src/components/RecordDashboard.tsx` (lines 15–43, CardGrid; lines 209–216, uncategorized section)
- **RecordDashboard.test.tsx:** `app/frontend/src/components/RecordDashboard.test.tsx` (existing tests to reference)
- **Test pattern:** `app/frontend/src/components/AppShell.test.tsx` (example of vitest + @testing-library/react + MemoryRouter)
- **RecordSummary type:** `app/frontend/src/api/client.ts` (lines 134–143)
- **Theme:** `app/frontend/src/theme.ts` (stampClass mapping)
