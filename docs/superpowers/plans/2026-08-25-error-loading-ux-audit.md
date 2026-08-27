# Error/Loading States & UX Flow Audit Plan

**Wave:** 3 (parallel with audit-RecordEditor-RecordIntake-mergeRelated-integration and others -- shares RecordEditor.test.tsx/RecordIntake.test.tsx with that plan, coordinate/merge test additions rather than overwrite)
**Consumes:** RecordEditor.tsx / RecordIntake.tsx / RelatedRecordsGraph.tsx / relatedRecords.ts / backlinks.ts as of Wave 2 (read-only)
**Produces:** error/loading UX findings + test coverage (no source changes)
**Owns exclusively:** RecordDashboard.test.tsx, Overview.test.tsx (adds cases to RecordEditor.test.tsx/RecordIntake.test.tsx -- coordinate with Plan 7)

**Goal**: Verify that error alerts (API failures, extraction errors, save conflicts) render correctly in all record editors, dashboards, and intake flows. Audit backlinks API calls work for all record types. Validate the RelatedRecordsGraph and related_documents merging logic. Identify missing UX patterns (e.g., cancel buttons).

**Depth**: Single-pass audit; issues identified will be filed as separate work items for remediation.

---

## Scope

### Components Under Review
- **RecordEditor** (`app/frontend/src/components/RecordEditor.tsx`)
- **RecordIntake** (`app/frontend/src/components/RecordIntake.tsx`)
- **RecordDashboard** (`app/frontend/src/components/RecordDashboard.tsx`)
- **Overview** (`app/frontend/src/pages/Overview.tsx`)
- **RelatedRecordsGraph** (`app/frontend/src/components/RelatedRecordsGraph.tsx`)
- **NoteEditor** (`app/frontend/src/pages/NoteEditor.tsx`)
- **API layer**: `backlinks.ts`, `relatedRecords.ts`, `client.ts`
- **Type-specific dashboards**: CapDashboard, IncidentDashboard, SopDashboard, etc. (sample 2-3)
- **Type-specific intake pages**: CapIntake, ChangeIntake, etc. (sample 2-3)

### Error & Loading States to Audit
1. **Initial load states**: loading indicators, skeleton screens, "Loading…" text
2. **API errors**: network failures, server 5xx, 4xx errors, timeout handling
3. **Save conflicts**: EditConflictError handling, reload buttons
4. **Extraction errors**: AI extraction failures, fallback behavior
5. **Backlinks errors**: silent swallowing vs. user visibility
6. **Related records graph errors**: fetch failures for titles and incoming links
7. **File upload errors**: attachment upload failures in NoteEditor
8. **Partial failures**: Overview loads from multiple APIs; verify failed types are clearly marked

### UX Flow Gaps to Identify
1. Missing cancel buttons on RecordIntake, all Intake pages
2. No explicit success feedback on certain operations
3. Error message clarity and actionability
4. Loading state clarity (animated spinners vs. static "Loading…" text)
5. Recovery path visibility (e.g., Reload button on conflict)

---

## Task Breakdown

### 1. RecordEditor Error/Loading States (Edit Flow)

**File**: `app/frontend/src/components/RecordEditor.tsx`

#### 1.1 Load Phase Audit
- [ ] Verify `loaded` state is checked before rendering form (line 53: already done)
- [ ] Check that loading indicator is visible and clear (currently just `<p>Loading…</p>`)
- [ ] **Issue to identify**: No skeleton/spinner; "Loading…" is minimal
- [ ] Verify `api.get(filename)` error is handled (currently not caught)
  - Lines 37-48: `api.get()` is never wrapped in try/catch
  - Silent failure will leave `loaded` as false indefinitely
  - **Issue to identify**: No error state for failed load

#### 1.2 Save Phase Audit
- [ ] `handleSave()` catches both errors and `SaveConflictError` (lines 76-82)
- [ ] Verify `setSaveError()` displays error for non-conflict errors (line 117-119)
- [ ] Verify conflict state shows Reload button (lines 121-128)
- [ ] Verify loading state disables Save button during save (line 109: `disabled={saving}`)
- [ ] Verify "Saved" success message displays (lines 129-133)
- [ ] **Check**: Does merging of related_documents work? (lines 68-71 call `mergeRelated()`)
  - Lines 70-71: merges frontmatter.related_documents with parseRelatedSection(body)
  - Sets merged as frontmatter before save
  - Verify this doesn't overwrite user's manual field edits

#### 1.3 Backlinks Loading (Side Effect)
- [ ] Lines 44-47: `findBacklinks(id)` is called after load succeeds
- [ ] Error is silently caught: `.catch(() => setBacklinks([]))`
- [ ] **Issue to identify**: User has no feedback if backlinks fetch fails
- [ ] Verify backlinks display when available (lines 135-148)

#### 1.4 Delete Phase
- [ ] Lines 86-90: Confirm dialog before delete (already done)
- [ ] No error state if delete fails
- [ ] **Issue to identify**: No error message if api.remove() throws

---

### 2. RecordIntake Error/Loading States (Intake Flow)

**File**: `app/frontend/src/components/RecordIntake.tsx`

#### 2.1 Extraction Phase
- [ ] `extracting` state disables Extract button (line 111: `disabled={!rawText.trim() || extracting}`)
- [ ] Button text changes to "Extracting…" during fetch (line 114)
- [ ] Extract error displays (lines 116-120)
- [ ] Verify error is caught from `api.extract(rawText)` (lines 49-61)
- [ ] Auto-extraction on mount works (lines 69-74)
- [ ] **Check**: Does auto-extract error surface? (line 71: `handleExtract()` is called, errors caught)

#### 2.2 Save Phase
- [ ] `saving` state disables Save button (line 137: `disabled={saving}`)
- [ ] Save error displays inline (lines 140-144)
- [ ] Related documents merging works (lines 85): calls `mergeRelated()` on save
- [ ] **Issue to identify**: No success message after save (unlike RecordEditor)

#### 2.3 UX Gaps
- [ ] **MISSING**: No cancel button exists anywhere on RecordIntake
  - Lines 95-146: form, extract button, save button, but no way to go back
  - All Intake pages (CapIntake, ChangeIntake, etc.) reuse RecordIntake; all affected
  - Users are trapped until save succeeds

---

### 3. RecordDashboard Error/Loading States

**File**: `app/frontend/src/components/RecordDashboard.tsx`

#### 3.1 Load Phase
- [ ] Lines 79-84: `api.list()` is fetched in useEffect
- [ ] Error is caught and stored: `.catch((err: Error) => setError(err.message))`
- [ ] Error displays early: line 92 checks `if (error) return <p role="alert">{error}</p>`
- [ ] **Check**: Is error message user-friendly? (currently just raw error.message)

#### 3.2 Loading State
- [ ] **Issue to identify**: No loading indicator while api.list() is pending
- [ ] Records default to empty array; loading state indistinguishable from "no records"

#### 3.3 Delete Flow
- [ ] Confirm dialog before delete (line 87: already done)
- [ ] No error handling if delete fails
- [ ] **Issue to identify**: If delete fails, record stays in list with no feedback

---

### 4. Overview Dashboard Error/Loading States

**File**: `app/frontend/src/pages/Overview.tsx`

#### 4.1 Parallel Load Phase
- [ ] Lines 176-182: 7 parallel api.list() calls for each record type
- [ ] Failures tracked in `failedTypes` array
- [ ] Error display: lines 211-214 show failed types at top
- [ ] **Check**: Does partial failure degrade gracefully?
  - If 1 of 7 fails, others still render
  - User sees which types failed (good)
  - Records from failed types don't contribute to metrics (correct)

#### 4.2 Accession/Import Flow (File Drop)
- [ ] Lines 56-76: `importFolder()` handles multiple files
- [ ] Loading state: `importing` flag (line 47)
- [ ] Error tracking: `failed` counter, no per-file error details
- [ ] **Issue to identify**: Batch import doesn't show which specific files failed
- [ ] Result message shows: line 73-75 "Imported N notes from X (M failed)"
  - No way to retry individual failed files

#### 4.3 File Read Error
- [ ] Lines 93-98: Single file path calls `readFileText()` in try/catch
- [ ] Error swallowed: line 95 `catch { // ponytail: unreadable file, user can still paste text manually }`
- [ ] User is silently allowed to paste manually; this is acceptable per comment

---

### 5. RelatedRecordsGraph Error/Loading States

**File**: `app/frontend/src/components/RelatedRecordsGraph.tsx`

#### 5.1 Fetch Titles
- [ ] Lines 55-59: `fetchAllRecordOptions()` is called in useEffect
- [ ] Error is silently caught: `.catch(() => setTitles({}))`
- [ ] **Issue to identify**: If fetch fails, graph shows record IDs instead of titles
  - User has no feedback that titles failed to load
  - Graph is still functional (links render) but less informative

#### 5.2 Fetch Backlinks
- [ ] Lines 61-66: `findBacklinks(centerId)` is called in separate useEffect
- [ ] Error is silently caught: `.catch(() => setIncoming([]))`
- [ ] **Issue to identify**: If backlinks fail to load, incoming links disappear
  - No indication to user that incoming links were attempted and failed
  - Graph may appear incomplete

#### 5.3 Render States
- [ ] Lines 68-75: If no incoming and no outgoing links, shows "No linked records" message
- [ ] **Check**: Is this path tested? (component renders even with empty graph)

---

### 6. NoteEditor Error/Loading States

**File**: `app/frontend/src/pages/NoteEditor.tsx`

#### 6.1 SourcesPanel (Attachment Upload)
- [ ] Lines 28-31: `listEvidence()` is called on mount
- [ ] Error is caught: `.catch((err: Error) => setError(err.message))`
- [ ] Error displays inline (lines 78-82)
- [ ] Uploading state disables file input (line 73: `disabled={uploading}`)
- [ ] Button text changes to "Uploading…" (line 69)
- [ ] After upload, calls `load()` to refresh (line 42)
- [ ] **Check**: Upload error handling in line 43-44

---

### 7. API Layer Error Handling

**File**: `app/frontend/src/api/backlinks.ts`

#### 7.1 findBacklinks() Error Propagation
- [ ] Lines 10-23: Fetches from all record types via `Promise.all()`
- [ ] **Issue to identify**: If ONE type's api.list() fails, entire Promise.all() rejects
- [ ] Calling code (RecordEditor line 46, RelatedRecordsGraph line 63) catches and silently ignores
- [ ] **Architectural issue**: Backlinks are broken if any single record type API fails
  - Should catch per-type and return partial results

**File**: `app/frontend/src/api/relatedRecords.ts`

#### 7.2 fetchAllRecordOptions() Error Propagation
- [ ] Lines 24-40: Same issue as backlinks
- [ ] Promise.all() on all types; failure cascades
- [ ] Cached promise never resets if first attempt fails
- [ ] **Issue to identify**: If first fetch fails, retry calls return cached rejection
- [ ] RelatedRecordsGraph catches and swallows (line 58)

#### 7.3 parseRelatedSection() and mergeRelated()
- [ ] Lines 52-78: `parseRelatedSection()` parses "## Related" markdown section
- [ ] Lines 73-78: `mergeRelated()` deduplicates and combines arrays
- [ ] **Check**: Test coverage for edge cases
  - Empty array
  - Duplicates in parsed section
  - Malformed IDs

---

### 8. Type-Specific Dashboards & Intakes (Sampling)

#### 8.1 Sample Dashboard (CapDashboard)
**File**: `app/frontend/src/pages/CapDashboard.tsx`

- [ ] Inherits all error/loading patterns from RecordDashboard
- [ ] No additional error handling needed

#### 8.2 Sample Intake (CapIntake)
**File**: `app/frontend/src/pages/CapIntake.tsx`

- [ ] Inherits all error/loading patterns from RecordIntake
- [ ] No cancel button (inherited UX gap)
- [ ] handleSave() doesn't catch errors; relies on RecordIntake callback
- [ ] **Issue to identify**: If navigate() fails, user is stuck on intake form

---

## Verification Steps

### Phase 1: Error State Visibility

**For each component, simulate failures and verify:**

1. **RecordEditor - Load Failure**
   - Mock `api.get()` to reject
   - **Expected**: Component should show error message and allow retry
   - **Actual**: Component shows "Loading…" forever (no error state exists)
   - **Test file**: `app/frontend/src/components/RecordEditor.test.tsx` (add test case)

2. **RecordEditor - Backlinks Fetch Failure**
   - Mock `findBacklinks()` to reject
   - **Expected**: Component should show error or skip backlinks section
   - **Actual**: Error is silently swallowed; no feedback to user
   - **Test file**: Add test case to existing test

3. **RecordIntake - Extract Failure**
   - Mock `api.extract()` to reject with "API timeout"
   - **Expected**: Error message displays inline
   - **Actual**: Error displays in lines 116-120 ✓
   - **Test file**: `app/frontend/src/components/RecordIntake.test.tsx` (add test case)

4. **RecordDashboard - List Failure**
   - Mock `api.list()` to reject
   - **Expected**: Error displays at top, records empty
   - **Actual**: Error displays at line 92 ✓
   - **Test file**: `app/frontend/src/components/RecordDashboard.test.tsx` (verify test exists)

5. **Overview - Partial Failure (1 of 7 types fails)**
   - Mock one type's api.list() to reject
   - **Expected**: Other 6 types load normally, failed type listed in red
   - **Actual**: Lines 211-214 handle this ✓
   - **Test file**: `app/frontend/src/pages/Overview.test.tsx` (add test case)

6. **RelatedRecordsGraph - Backlinks Fetch Failure**
   - Mock `findBacklinks()` to reject
   - **Expected**: Graph shows only outgoing links, incoming row omitted or shows error
   - **Actual**: Graph silently omits incoming row; no error feedback
   - **Test file**: No test exists; add one

### Phase 2: API Resilience

1. **Backlinks API - Cascade Failure**
   - Test findBacklinks() when ONE record type's api.list() fails
   - **Current behavior**: Entire Promise.all() rejects, caller silently ignores
   - **Better behavior**: Catch per-type, return partial backlinks from successful types
   - **Decision point**: Is partial data acceptable or must we fail entirely?

2. **Related Records Cache - Stale Promise**
   - Call fetchAllRecordOptions() when network is offline
   - Retry when network comes back online
   - **Current behavior**: Cached promise still rejects on retry
   - **Better behavior**: resetRecordOptionsCache() is exported but only called in NoteIntake promote handler
   - **Check**: Is cache reset on retry needed?

### Phase 3: UX Flow Completeness

1. **RecordIntake - Cancel Button**
   - Navigate to /cap/new (intake form)
   - Look for cancel/back button
   - **Current**: No cancel button exists
   - **Impact**: User cannot go back without saving or force-navigating

2. **RecordEditor - Success Feedback**
   - Edit and save a record
   - Verify "Saved" message displays (lines 129-133)
   - **Current**: Message displays in red text color; not very prominent
   - **Better**: Success message could use green color or animation

3. **RecordDashboard - Loading Indicator**
   - Load a dashboard page
   - Observe while records are loading
   - **Current**: No skeleton or spinner; empty state same as "loading" state
   - **Better**: Spinner or skeleton grid would indicate data is incoming

4. **Overview - Import Progress**
   - Drop a folder with 10 files
   - Observe progress feedback
   - **Current**: "Importing notes…" displays, no per-file progress
   - **Better**: Show "Importing file 3/10" or similar

### Phase 4: Merge Logic Validation

1. **RecordEditor - Body Merge**
   - Edit body to include "## Related" section with links
   - Save record
   - **Check**: Lines 68-71 merge body's related section into frontmatter
   - Verify related_documents field now contains those IDs

2. **RecordIntake - Double Merge**
   - Enter raw text with "## Related" section
   - Click Extract (may also have related_documents in AI response)
   - Click Save with body containing "## Related"
   - **Check**: Lines 85 merges body's related section
   - Verify no duplicates in final frontmatter.related_documents

3. **mergeRelated() Edge Cases**
   - Test with null/undefined input
   - Test with duplicates in both arrays
   - Test with empty arrays
   - **Verify**: Function in relatedRecords.ts lines 73-78 handles all cases

---

## Issues to Document

As you work through verification, create issues for each finding. Use template:

```
# [Severity] [Component] - [Issue Title]

## Current Behavior
[What happens now]

## Expected Behavior
[What should happen]

## Steps to Reproduce
[Clear steps]

## Affected Files
- path/to/file.tsx (lines X-Y)

## Test Coverage
- [ ] Add test case
```

---

## Test Coverage Gaps to Fill

1. **RecordEditor.test.tsx**
   - [ ] Add test case for load failure (api.get rejects)
   - [ ] Add test case for backlinks fetch failure (findBacklinks rejects)
   - [ ] Add test case for body merge with "## Related" section

2. **RecordIntake.test.tsx** (if not already covered)
   - [ ] Add test case for extract failure
   - [ ] Add test case for body merge on save

3. **RecordDashboard.test.tsx**
   - [ ] Verify test exists for list failure
   - [ ] Add test case for delete failure

4. **Overview.test.tsx**
   - [ ] Add test case for partial failure (1 of 7 types fails)

5. **RelatedRecordsGraph** - Create test file if none exists
   - [ ] Test case for empty graph (no incoming, no outgoing)
   - [ ] Test case for backlinks fetch failure
   - [ ] Test case for titles fetch failure

---

## Deliverables

1. **Issues list** (GitHub/Linear): One issue per finding, tagged with `error-handling`, `ux-flow`, `api`, as appropriate
2. **Test additions**: PR with new test cases covering error scenarios
3. **Audit summary** (doc): One-page summary of findings and priority tiers

---

## Estimated Effort

- **Phase 1 (Error Visibility)**: 2-3 hours (run components, identify gaps)
- **Phase 2 (API Resilience)**: 1-2 hours (trace promise chains, test failures)
- **Phase 3 (UX Flow)**: 1 hour (walk through workflows)
- **Phase 4 (Merge Logic)**: 1 hour (trace and test edge cases)
- **Issue Writing**: 1-2 hours (document all findings)
- **Total**: 6-9 hours

---

## Notes

- **Ponytail**: Focus on identifying issues, not fixing. Fixes are separate work items.
- **Silent Errors**: Several API calls silently swallow errors (backlinks, related records graph). Decide per issue whether this is acceptable (graceful degradation) or should surface feedback.
- **Promise.all() Cascade**: Backlinks and related records cache use Promise.all(), causing one failure to cascade. Evaluate whether per-type error handling is needed.
- **Merge Logic**: The body's "## Related" section merging is duplicated between RecordEditor and RecordIntake. Consider consolidating this logic later.
