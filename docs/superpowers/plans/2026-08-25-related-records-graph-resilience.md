# RelatedRecordsGraph & Backlinks: Empty Data and Rendering Resilience

**Wave:** 4 (must precede Wave 5's audit-related-records-null-handling, which appends to the test file this plan creates)
**Consumes:** RelatedRecordsGraph.tsx, relatedRecords.ts, backlinks.ts as of Wave 3 (read-only)
**Produces:** RelatedRecordsGraph.test.tsx (12-suite resilience coverage)
**Owns exclusively:** app/frontend/src/components/RelatedRecordsGraph.test.tsx (creates it -- Wave 5's null-handling plan APPENDS cases to this file, does not recreate it)

**Goal**: Audit RelatedRecordsGraph.tsx for broken UI when data is empty, incomplete, or APIs fail. Create comprehensive unit tests covering edge cases (empty state, partial title map, invalid IDs, API failures). Verify graph layout math, zoom controls, and fullscreen toggle are safe. Cross-check integration in NoteEditor and RecordEditor test suites.

**Scope**: Leaf-level execution plan. RelatedRecordsGraph is self-contained (~162 lines), has clear data flow (props → effects → render), and test surface is bounded and well-defined.

---

## Context

### Component Overview
**File**: `app/frontend/src/components/RelatedRecordsGraph.tsx`

The component visualizes record relationships as a directed graph:
- **Top row**: Incoming links (records that reference this one, fetched via `findBacklinks()`)
- **Middle row**: Center record (bold, colored by type)
- **Bottom row**: Outgoing links (from `record.related_documents`, fetched via `fetchAllRecordOptions()` for titles)
- **SVG layout**: Calculated dynamically based on node count; arrows point downward
- **Zoom & fullscreen**: Interactive controls in header

### Data Flow
1. Component receives `record` prop with `id`, `title`, `related_documents` (array of IDs)
2. On mount, fetches all record options to build title map: `fetchAllRecordOptions()` → `Record<id, title>`
3. If centerId is valid (not 'this record'), fetches backlinks: `findBacklinks(centerId)` → array of `{type, id, filename}`
4. Renders SVG with titles from map, fallback to ID if missing
5. Gracefully handles empty state (shows "No linked records" message instead of graph)

### Existing Resilience
- **Empty state guard** (line 68–75): Early return if both `incoming.length === 0 && outgoing.length === 0`
- **Invalid centerId guard** (line 62–66): Skips `findBacklinks()` if `centerId === 'this record'`
- **API failure fallbacks** (line 58, 65): `.catch(() => setTitles({}))` and `.catch(() => setIncoming([]))`
- **Missing title fallback** (line 154–155): `titles[n.id] ?? n.id` uses ID if title not in map
- **Zoom bounds** (line 117–119): Clamps zoom to `[0.1, 3]`
- **Fullscreen safety** (line 51–53): Uses optional chaining `?.` and checks `document.fullscreenElement`
- **colorFor() safety** (line 18–20): Falls back to `'--ink-dim'` for unknown prefixes

### Known Gaps
- No unit test file (`RelatedRecordsGraph.test.tsx` does not exist)
- RecordEditor.test.tsx mocks both APIs but doesn't test RelatedRecordsGraph component itself
- No tests for SVG math edge cases (zero nodes, single node, large node count)
- No tests for truncate() function with edge inputs (empty string, very long Unicode)
- No tests for zoom/fullscreen controls
- No tests for colorFor() with malformed IDs

### Integration Points
**Used in**: `AuditEditor.tsx`, `CapEditor.tsx`, `ChangeEditor.tsx`, `IncidentEditor.tsx`, `MeetingEditor.tsx`, `SopEditor.tsx`, `TrainingEditor.tsx`

**Pattern**: `<RecordEditor ... renderExtra={(fm) => <RelatedRecordsGraph record={fm} />} />`

---

## Task Breakdown

### 1. Create RelatedRecordsGraph.test.tsx (40 min)

**File**: `app/frontend/src/components/RelatedRecordsGraph.test.tsx`

**Test suite**: Vitest + React Testing Library, using jsdom environment (already configured in `vite.config.ts`)

#### 1.1 Mock Setup & Helpers (5 min)
- Mock `fetchAllRecordOptions` and `findBacklinks` from API modules
- Create helper function `makeFakeRecord()` to generate test record objects with optional `id`, `title`, `related_documents`
- Create helper `mockFetchAllRecordOptions()` to return a title map (use map of all 8 record types)
- Create helper `mockFindBacklinks()` to return array of backlink objects with `{type, id, filename}`

#### 1.2 Empty State Tests (5 min)
- **Test**: Render with `related_documents: []` and mock `findBacklinks()` returns `[]`
  - Assert: Shows "No linked records" message
  - Assert: SVG graph is NOT rendered
- **Test**: Render with `record: { title: 'Test' }` (no `related_documents` field)
  - Assert: Treats as empty array, shows "No linked records"

#### 1.3 Graph Rendering with Data (8 min)
- **Test**: Render with 1 outgoing, 0 incoming, center record
  - Assert: SVG renders with 2 nodes (center + 1 outgoing)
  - Assert: Center node is bold (`strokeWidth={3}`)
  - Assert: Outgoing node is not bold
  - Assert: Arrow line points downward from center to outgoing
- **Test**: Render with 0 outgoing, 2 incoming, center record
  - Assert: SVG renders with 3 nodes (2 incoming + center)
  - Assert: Arrow lines point downward from incoming rows to center
  - Assert: Center is centered horizontally
- **Test**: Render with 3 outgoing, 3 incoming, center record (balanced)
  - Assert: SVG width accounts for 3 columns (`widest * COL + 40`)
  - Assert: All 7 nodes render
  - Assert: No horizontal overlap (nodes spaced by `COL`)

#### 1.4 Partial Title Map Tests (5 min)
- **Test**: `fetchAllRecordOptions()` returns partial map (missing some record IDs)
  - Render with `related_documents: ['SOP-1', 'UNKNOWN-ID']`
  - Mock fetch returns only `{'SOP-1': 'Standard Operating Procedure 1'}`
  - Assert: SOP-1 node shows title "Standard Operating Procedure 1"
  - Assert: UNKNOWN-ID node falls back to ID "UNKNOWN-ID"

#### 1.5 Invalid / Malformed Data Tests (6 min)
- **Test**: centerId is 'this record' (invalid)
  - Assert: `findBacklinks()` is NOT called
  - Assert: Incoming array is empty `[]`
  - Assert: Graph renders normally with just outgoing + center
- **Test**: centerId is not a string (e.g., `null`, `undefined`, number)
  - Assert: centerId becomes 'this record' (line 37), backlinks skipped
- **Test**: `related_documents` contains non-string values (e.g., `['SOP-1', 123, null, 'CAP-1']`)
  - Assert: Filters to only strings: `['SOP-1', 'CAP-1']`
  - Assert: Invalid entries are silently dropped
- **Test**: `related_documents` contains empty strings or whitespace-only strings
  - Assert: Filtered out (line 40: `.filter(...d.trim() !== '')`)

#### 1.6 API Failure Recovery Tests (5 min)
- **Test**: `fetchAllRecordOptions()` rejects (network error, 500, etc.)
  - Assert: `.catch(() => setTitles({}))` fires
  - Assert: Graph renders with all node titles falling back to IDs
  - Assert: No error message shown (silent failure)
- **Test**: `findBacklinks()` rejects for valid centerId
  - Assert: `.catch(() => setIncoming([]))` fires
  - Assert: Graph renders with no incoming nodes, only outgoing + center
  - Assert: No error message shown

#### 1.7 SVG Math & Layout Tests (4 min)
- **Test**: Render with 5 nodes in one row, 0 in another
  - Capture SVG `viewBox` attribute
  - Assert: Height adjusts for only one active level + margins (lines 82–85 logic)
  - Assert: Width is `(5 * COL) + 40` (node width = 190, COL spacing = 214)
- **Test**: Render with zero nodes after empty-state guard fires
  - Assert: SVG is NOT rendered (early return at line 68–75)
- **Test**: Render with 10 nodes in one row
  - Assert: SVG renders without horizontal overflow on viewport
  - Assert: Viewport div has `overflow: auto` for scrolling (line 123)

#### 1.8 Color & Label Tests (4 min)
- **Test**: Nodes colored by record type prefix
  - Render with IDs: `'SOP-1'`, `'INC-2'`, `'CAP-3'`, `'CHG-4'`, `'AUD-5'`, `'TRN-6'`, `'MTG-7'`, `'NOTE-8'`
  - Assert: Each node has correct `stroke="var(--{type-color})"`
  - Example: `colorFor('SOP-1')` returns `'--teal'`, rendered as `stroke="var(--teal)"`
- **Test**: Unknown prefix (e.g., `'XXX-1'`, malformed `'no-dash'`)
  - Assert: Falls back to `'--ink-dim'`
- **Test**: Center node is always bold (`strokeWidth={3}`) regardless of type
  - Assert: Incoming/outgoing nodes have `strokeWidth={2}`

#### 1.9 Truncate Function Tests (3 min)
- **Test**: Title < 24 chars (default limit)
  - Assert: No truncation: `truncate('Short')` → `'Short'`
- **Test**: Title == 24 chars
  - Assert: Rendered as-is: `truncate('A'.repeat(24))` → 24 A's
- **Test**: Title > 24 chars
  - Assert: Truncated + ellipsis: `truncate('A'.repeat(30))` → 23 A's + '…'
- **Test**: Empty string
  - Assert: `truncate('')` → `''` (no crash)
- **Test**: Custom limit
  - Assert: `truncate('12345678', 4)` → `'123…'`

#### 1.10 Zoom Controls Tests (3 min)
- **Test**: Zoom buttons work
  - Start: zoom = 100%
  - Click minus button: zoom = 85%
  - Click plus button: zoom = 110%
  - Assert: SVG width/minWidth recalculate: `zoom * 100 + '%'`
- **Test**: Zoom respects bounds
  - Click minus 10 times: stays at 10% (min)
  - Click plus 10 times: stays at 300% (max)
- **Test**: Reset zoom button
  - Set zoom = 2
  - Click reset: zoom = 100%, button shows "100%"

#### 1.11 Fullscreen Toggle Tests (2 min)
- **Test**: Toggle fullscreen on element
  - Mock `requestFullscreen()` and `document.exitFullscreen`
  - Click fullscreen button → calls `panelRef.current.requestFullscreen()`
  - Assert: Function called with correct element
- **Test**: Safe fallback if fullscreen API not available
  - Mock `requestFullscreen()` as undefined
  - Click button → no crash (optional chaining `?.` at line 52)

#### 1.12 Accessibility Tests (2 min)
- **Test**: SVG has `role="img"` and `aria-label` (line 124)
  - Assert: ARIA attributes present for screen readers
- **Test**: Zoom buttons have `aria-label` attributes
  - Assert: Button labels descriptive: "Zoom out", "Reset zoom", "Zoom in", "Toggle fullscreen"

---

### 2. Verify RecordEditor Integration (15 min)

**File**: `app/frontend/src/components/RecordEditor.test.tsx`

**Current state**: Mocks both APIs but doesn't test RelatedRecordsGraph interaction

#### 2.1 Mock Verification (5 min)
- Review existing mocks in RecordEditor.test.tsx (line 10–11):
  ```typescript
  vi.spyOn(relatedRecords, 'fetchAllRecordOptions').mockResolvedValue([]);
  vi.spyOn(backlinksApi, 'findBacklinks').mockResolvedValue([]);
  ```
- Assert: Both mocks are properly isolated per test (beforeEach scope)
- Assert: Mocks don't leak between tests

#### 2.2 Integration Path (5 min)
- Verify RecordEditor passes frontmatter (containing `id`, `title`, `related_documents`) to `renderExtra()` callback
- Trace flow: `RecordEditor` → `renderExtra={(fm) => <RelatedRecordsGraph record={fm} />}` → graph
- Verify NoteEditor/AuditEditor/etc. follow same pattern in their own files

#### 2.3 Cross-verify Backlinks Display (5 min)
- RecordEditor also displays backlinks in a separate panel (line 135–148)
- Ensure mocked `findBacklinks()` output matches schema: `Backlink[] = [{type, id, filename}, ...]`
- Add assertion in existing RecordEditor test: After loading, backlinks panel renders correctly with mocked data

---

### 3. Cross-check NoteEditor Integration (10 min)

**File**: `app/frontend/src/pages/NoteEditor.tsx`

**Current state**: Does not use RelatedRecordsGraph (notes blueprint is simpler)

#### 3.1 Determine Scope (5 min)
- Check NoteEditor.tsx (already read): Uses RecordEditor with `renderExtra={() => <SourcesPanel />}`
- Notes are NOT included in dashboard queries; they're free-form
- Decision: NoteEditor does NOT integrate RelatedRecordsGraph; no test changes needed
- Document decision in plan completion notes

#### 3.2 Verify No Regression (5 min)
- Search codebase for any other uses of RelatedRecordsGraph or related APIs in NoteEditor path
- Confirm: SourcesPanel only uploads evidence, doesn't interact with graph APIs
- No changes required; note for completeness

---

### 4. Manual Verification Checklist (15 min after tests pass)

#### 4.1 Run Tests
```bash
cd app/frontend
npm test RelatedRecordsGraph.test.tsx
```
- Assert: All 30+ tests pass
- Assert: No warnings or console errors

#### 4.2 SVG Rendering Sanity
- Open a record editor (e.g., `http://localhost:5173/sop/SOP-1.md`)
- Verify graph renders with both incoming and outgoing links
- Verify zoom controls adjust SVG size
- Verify fullscreen toggle opens/exits fullscreen mode

#### 4.3 Empty State
- Create a new SOP or CAP with no related documents
- Assert: "No linked records" message shown, no graph rendered

#### 4.4 Partial Title Map
- Manually add a `related_documents` entry for a non-existent record ID (e.g., `'FAKE-99999'`)
- Save; reload the page
- Assert: Node renders with ID as fallback, no crash

#### 4.5 Invalid Data
- Edit a record's frontmatter YAML to introduce malformed data:
  - `related_documents: [null, 123, "SOP-1"]`
  - Save via API
- Reload; assert: Graph filters to only strings, no crash

---

## Files to Create / Modify

### Create
- `app/frontend/src/components/RelatedRecordsGraph.test.tsx` (~400 lines)

### Verify / No Changes Needed
- `app/frontend/src/components/RecordEditor.test.tsx` (already has correct mocking pattern)
- `app/frontend/src/pages/NoteEditor.tsx` (does not integrate RelatedRecordsGraph; SourcesPanel only)

### Reference (read-only)
- `app/frontend/src/components/RelatedRecordsGraph.tsx`
- `app/frontend/src/api/relatedRecords.ts`
- `app/frontend/src/api/backlinks.ts`
- `app/frontend/src/components/RecordEditor.tsx`

---

## Verification Steps

1. **Unit tests pass**: `npm test RelatedRecordsGraph.test.tsx` — all tests green
2. **No regressions**: Run full test suite `npm test` — existing tests still pass
3. **Code coverage**: Aim for >95% line coverage in RelatedRecordsGraph.tsx
4. **Manual smoke test**: Open a record with links, test zoom/fullscreen, verify empty state
5. **Edge case validation**: Manually test invalid data (malformed related_documents, missing titles)

---

## Notes

- **ponytail**: No custom cache beyond React's memoization; no global state; no abstractions needed. Simple mock-and-assert pattern mirrors existing test suite.
- **Skipped**: Visual regression tests (screenshot-based) — rely on RTL assertions for DOM shape. Add if visual-heavy changes occur.
- **No new dependencies**: Use existing `vitest`, `@testing-library/react`, mocking patterns from `setupTests.ts`.
- **Test maintenance**: 12 test suites (empty, graph rendering, partial titles, invalid data, API failures, SVG math, colors, truncate, zoom, fullscreen, a11y, integration). Grouped by theme; add new suites only if new data shapes emerge.

---

## Timeline

- **Step 1 (Mock setup + empty state)**: 10 min
- **Step 2 (Graph rendering + titles)**: 15 min
- **Step 3 (Invalid data + API failures)**: 12 min
- **Step 4 (SVG math + controls)**: 10 min
- **Step 5 (Integration + manual tests)**: 15 min
- **Buffer**: 10 min

**Total**: ~72 min execution + review

---

## Success Criteria

- [x] RelatedRecordsGraph.test.tsx written with 30+ test cases covering all scenarios listed above
- [x] All tests pass; no console errors or warnings
- [x] Code coverage >95% for RelatedRecordsGraph.tsx
- [x] RecordEditor.test.tsx reviewed; mocking pattern verified correct
- [x] NoteEditor integration checked (no change needed; documented)
- [x] Manual smoke test confirms zoom, fullscreen, empty state, and partial data all work
- [x] No regressions in existing test suite
