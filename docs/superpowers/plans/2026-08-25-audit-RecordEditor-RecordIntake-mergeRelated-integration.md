# Audit: RecordEditor & RecordIntake mergeRelated Integration

**Wave:** 3 (parallel with error-loading-ux-audit, nav-and-api-endpoint-audit, orphaned-pages-routing-gaps-audit, navigation-flow-verification, route-import-audit, wrapper-component-instantiation-audit -- coordinate on shared test files per orchestration index seam map)
**Consumes:** RecordEditor.tsx / RecordIntake.tsx as fixed in Wave 2 (blueprint-backend-consistency-audit, blueprint-coverage-naming-audit)
**Produces:** integration test coverage (no source changes)
**Owns exclusively:** app/frontend/src/components/RecordEditor.test.tsx, RecordIntake.test.tsx, DynamicForm.test.tsx

## Goal

Add test coverage for the `mergeRelated()` flow across RecordEditor and RecordIntake components. Verify that:
1. RecordEditor.handleSave correctly merges body-parsed IDs into `related_documents` frontmatter and updates state
2. RecordIntake.handleExtract merges both API-returned and body-parsed related documents
3. RecordIntake.handleSave catches "## Related" sections even when user never clicked Extract
4. RelatedDocumentsPicker gracefully handles `fetchAllRecordOptions` failures
5. Title-protection logic (initialTitle beats extracted title) works correctly alongside merging
6. Edge cases handled: empty/undefined/null related_documents, duplicates, type coercion

## Context

**Current state:**

- `RecordEditor.tsx` (line 70): calls `mergeRelated(frontmatter.related_documents, parseRelatedSection(body))` in `handleSave()`, but updates state _after_ merge completes
- `RecordIntake.tsx` (lines 58, 85): 
  - Line 58: during extraction, merges API result + body-parsed IDs
  - Line 85: during save, catches "## Related" section even if Extract was never clicked
  - Also maintains `initialTitle` protection (lines 35-56)
- `DynamicForm.tsx` (lines 36-38): RelatedDocumentsPicker has graceful catch for `fetchAllRecordOptions` failure (`catch(() => setOptions([]))`)

**Test coverage:**
- `RecordEditor.test.tsx`: 6 tests, **none verify the mergeRelated flow or state updates**
- `RecordIntake.test.tsx`: 10 tests, **none verify mergeRelated during extraction or save**
- `DynamicForm.test.tsx`: has some related-documents tests (lines 50-81), but **no test for fetchAllRecordOptions failure**

**Key behaviors to test:**
1. `mergeRelated()` is called and state updates reflect the merged result
2. Body-parsed IDs (from "## Related" section) are included in the save payload
3. API-returned `related_documents` + body-parsed IDs are merged (not replaced)
4. `initialTitle` protection doesn't break when merging happens
5. Graceful fallback when fetchAllRecordOptions fails (empty options list)

## Step-by-Step Tasks

### Task 1: Add mergeRelated flow tests to RecordEditor.test.tsx

**File:** `app/frontend/src/components/RecordEditor.test.tsx`

Add a new `describe('RecordEditor - mergeRelated integration')` block with 4 tests:

**Test 1.1: handleSave merges body-parsed IDs into frontmatter**
- Setup: Load a record with `related_documents: ['SOP-1']`
- Action:
  - Edit body to include "## Related\n- CAP-2\n- INC-3"
  - Click Save
- Verify:
  - `api.save()` is called with frontmatter containing `related_documents: ['SOP-1', 'CAP-2', 'INC-3']`
  - Component state (`frontmatter`) updates to reflect merged result
  - No duplicates if body already contains an ID in frontmatter

**Test 1.2: handleSave updates state after mergeRelated completes**
- Setup: Load record, edit body to add "## Related\n- NEW-ID"
- Action: Save
- Verify:
  - After `api.save()` resolves, component's `frontmatter` state includes `NEW-ID` in `related_documents`
  - This ensures UI reflects the merge (e.g., related_documents field in DynamicForm updates)

**Test 1.3: handleSave deduplicates when body has ID already in frontmatter**
- Setup: Record with `related_documents: ['SOP-1', 'CAP-2']`
- Action: Edit body to "## Related\n- SOP-1\n- NEW-ID"
- Verify: `api.save()` called with `related_documents: ['SOP-1', 'CAP-2', 'NEW-ID']` (no duplicate SOP-1)

**Test 1.4: handleSave on empty related_documents and empty body Related section**
- Setup: Record with `related_documents: undefined` or `[]`
- Action: Edit body without a "## Related" section or with empty section
- Verify: `api.save()` called with `related_documents: []`

**Pseudo-code structure:**

```js
describe('RecordEditor - mergeRelated integration', () => {
  it('merges body-parsed IDs into frontmatter related_documents on save', async () => {
    const api = makeFakeApi();
    render(<MemoryRouter><RecordEditor api={api} ... /></MemoryRouter>);
    await waitFor(() => expect(screen.getByLabelText('Owner *')).toHaveValue('Jane'));
    
    fireEvent.change(screen.getByLabelText('Body'), {
      target: { value: '# Text\n## Related\n- CAP-2\n- INC-3' }
    });
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() =>
      expect(api.save).toHaveBeenCalledWith(
        'CAP-1.md',
        expect.objectContaining({ related_documents: ['SOP-1', 'CAP-2', 'INC-3'] }),
        expect.any(String),
        'hash-1'
      )
    );
  });
  
  it('updates component state after mergeRelated', async () => {
    // ... load, edit, save, then verify frontmatter state contains merged IDs
  });
  
  it('deduplicates when body has ID already in frontmatter', async () => {
    // ... verify no duplicate when same ID appears in both places
  });
  
  it('handles empty related_documents and empty body Related section', async () => {
    // ... verify empty array result
  });
});
```

### Task 2: Add mergeRelated flow tests to RecordIntake.test.tsx

**File:** `app/frontend/src/components/RecordIntake.test.tsx`

Add two new `describe` blocks with 6 tests total:

**Test 2.1: handleExtract merges API-returned + body-parsed related documents**
- Setup: Mock `api.extract()` to return `{ related_documents: ['SOP-1'], department: 'QC', ... }`
- Action:
  - Enter raw text including "## Related\n- CAP-2"
  - Click Extract
- Verify:
  - After extraction completes, `fields.related_documents` includes both `['SOP-1', 'CAP-2']`
  - No duplicates if both API and body have same ID

**Test 2.2: handleExtract deduplicates across API + body results**
- Setup: Mock `api.extract()` to return `{ related_documents: ['SOP-1'], ... }`
- Action: Raw text with "## Related\n- SOP-1\n- CAP-2"
- Verify: Extraction results in `related_documents: ['SOP-1', 'CAP-2']` (SOP-1 not duplicated)

**Test 2.3: handleSave catches "## Related" section even without Extract click**
- Setup: Component with no extraction (user just types/pastes raw text directly into body field)
- Action:
  - Manually populate some fields (status, owner, etc.)
  - Enter body with "## Related\n- SOP-1\n- CAP-2"
  - Click Save (without clicking Extract first)
- Verify:
  - `onSave()` is called with frontmatter containing `related_documents: ['SOP-1', 'CAP-2']`
  - This ensures body links are captured even in direct-input flow

**Test 2.4: handleSave merges extracted + body-parsed when both exist**
- Setup: Auto-run extraction with `initialRawText` (which already merged API + body-parsed)
- Action:
  - User then edits body to add more "## Related" entries
  - Click Save
- Verify:
  - `onSave()` receives all three sources merged (API + initial body-parsed + edited body-parsed)

**Test 2.5: Title protection works with mergeRelated (initialTitle not overwritten)**
- Setup:
  - `initialTitle="My Note Title"`
  - `initialRawText="Some content\n## Related\n- SOP-1"`
  - Mock `api.extract()` to return `{ title: 'AI Guessed Title', related_documents: ['CAP-1'], ... }`
- Action: Component mounts (auto-runs extraction)
- Verify:
  - Title field remains "My Note Title" (not "AI Guessed Title")
  - `related_documents` merged to `['CAP-1', 'SOP-1']` (extraction + body-parsed)
  - Both title protection and merging work together correctly

**Test 2.6: handleSave on empty related_documents and empty body**
- Setup: Simple intake with no extraction, minimal fields
- Action: Click Save without any "## Related" section in body
- Verify: `onSave()` called with `related_documents: []` or undefined as it was initialized

**Pseudo-code structure:**

```js
describe('RecordIntake - mergeRelated during extraction', () => {
  it('merges API-returned and body-parsed related documents', async () => {
    const api = makeFakeApi();
    api.extract.mockResolvedValue({
      related_documents: ['SOP-1'],
      department: 'QC',
      tags: []
    });
    render(<RecordIntake api={api} blueprint={...} onSave={vi.fn()} />);
    
    fireEvent.change(screen.getByLabelText('Raw notes'), {
      target: { value: 'Content\n## Related\n- CAP-2' }
    });
    fireEvent.click(screen.getByText('Extract'));
    
    await waitFor(() => {
      // Verify via a snapshot, query check, or by examining the form value
      // (Need to check if related_documents field is rendered in blueprint for this integration)
    });
  });
  
  it('deduplicates across API and body-parsed results', async () => {
    // ... API returns ['SOP-1'], body has "## Related\n- SOP-1\n- CAP-2"
    // ... verify result is ['SOP-1', 'CAP-2']
  });
});

describe('RecordIntake - mergeRelated on save', () => {
  it('catches "## Related" section even without Extract click', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<RecordIntake api={makeFakeApi()} blueprint={...} onSave={onSave} />);
    
    // Manually set some fields (no Extract)
    fireEvent.change(screen.getByLabelText('Body'), {
      target: { value: 'Content\n## Related\n- SOP-1\n- CAP-2' }
    });
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ related_documents: ['SOP-1', 'CAP-2'] }),
        expect.any(String)
      )
    );
  });
  
  it('merges extracted + body-parsed when both exist', async () => {
    // ... initialRawText + edited body
  });
  
  it('title protection works with mergeRelated', async () => {
    // ... initialTitle + extracted title + merging
  });
  
  it('handles empty related_documents and empty body', async () => {
    // ... edge case
  });
});
```

### Task 3: Add fetchAllRecordOptions failure test to DynamicForm.test.tsx

**File:** `app/frontend/src/components/DynamicForm.test.tsx`

Add one test to the existing or new describe block:

**Test 3.1: RelatedDocumentsPicker gracefully handles fetchAllRecordOptions failure**
- Setup: Mock `fetchAllRecordOptions()` to reject with an error
- Action: Render DynamicForm with a related_documents field
- Verify:
  - Component renders without crashing
  - RelatedDocumentsPicker still shows the input field (options list is empty)
  - User can still type/enter a free-text ID (no forced dependency on successful fetch)
  - The catch block sets `options` to `[]` (already verified in code, now test observes it)

**Pseudo-code:**

```js
describe('DynamicForm - fetchAllRecordOptions fallback', () => {
  it('renders input and allows free-text entry when fetchAllRecordOptions fails', async () => {
    vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockRejectedValue(
      new Error('Network error')
    );
    const onChange = vi.fn();
    const relatedBlueprint: BlueprintField[] = [
      { key: 'related_documents', label: 'Related Documents', type: 'related' },
    ];
    render(<DynamicForm blueprint={relatedBlueprint} values={{}} onChange={onChange} />);

    // Input should still be present even though fetch failed
    const input = screen.getByLabelText('Related Documents');
    expect(input).toBeInTheDocument();

    // User can still type and commit a free-text ID
    fireEvent.change(input, { target: { value: 'CUSTOM-ID-999' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(onChange).toHaveBeenCalledWith('related_documents', ['CUSTOM-ID-999']);
  });
});
```

## Verification Steps

### Step 1: Run the full test suite for all modified files

```bash
cd app/frontend
npm run test -- RecordEditor.test.tsx RecordIntake.test.tsx DynamicForm.test.tsx
```

Verify **all tests pass** (existing + new).

### Step 2: Check coverage for modified test files

```bash
cd app/frontend
npm run test -- --coverage RecordEditor.test.tsx RecordIntake.test.tsx DynamicForm.test.tsx
```

**Expected coverage:**
- `RecordEditor.tsx`: `handleSave()` function should have 100% line coverage (specifically the mergeRelated call and state update)
- `RecordIntake.tsx`: `handleExtract()` and `handleSave()` functions should have 100% line coverage for mergeRelated paths
- `DynamicForm.tsx`: `RelatedDocumentsPicker` should have 100% coverage including the error catch block

### Step 3: Manual smoke test (optional but recommended)

Start the app and manually verify one flow:
1. Open an existing record in RecordEditor
2. Add a "## Related" section with IDs to the body
3. Save and verify related_documents field updates to include those IDs
4. OR: In intake, paste text with "## Related" section and click Save without Extract

## Files Affected

- `app/frontend/src/components/RecordEditor.test.tsx` — add 4 new tests
- `app/frontend/src/components/RecordIntake.test.tsx` — add 6 new tests
- `app/frontend/src/components/DynamicForm.test.tsx` — add 1 new test
- `app/frontend/src/components/RecordEditor.tsx` — read-only (audit only)
- `app/frontend/src/components/RecordIntake.tsx` — read-only (audit only)
- `app/frontend/src/components/DynamicForm.tsx` — read-only (audit only)
- `app/frontend/src/api/relatedRecords.ts` — read-only (audit only)

## Acceptance Criteria

1. ✓ All 11 new tests pass (4 in RecordEditor, 6 in RecordIntake, 1 in DynamicForm)
2. ✓ Test names clearly describe the mergeRelated behavior being verified
3. ✓ No changes to implementation files (audit-only)
4. ✓ Coverage reports show 100% line coverage on:
   - `RecordEditor.handleSave()` (lines 59-84)
   - `RecordIntake.handleExtract()` (lines 45-65)
   - `RecordIntake.handleSave()` (lines 80-92)
   - `DynamicForm.RelatedDocumentsPicker` (lines 19-96, especially error catch at 38)
5. ✓ All existing tests still pass (no regressions)

## Notes

- **State update verification:** After calling `handleSave()` or `handleExtract()`, use `waitFor()` to verify the component's state variables (via re-renders of child fields or spy assertions) reflect the merged result.
- **Mock setup:** Use the existing `makeFakeApi()` patterns in each test file; extend mocks for `api.extract()` and error cases as needed.
- **Graceful fallback:** The fetchAllRecordOptions failure test validates the existing error handling; no code changes should be needed, just test coverage.
