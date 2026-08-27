# Wrapper Component Instantiation Audit Plan

**Wave:** 3 (parallel with other Wave 3 audits; runs after Wave 2 routing/naming changes land)
**Consumes:** all 24 pages, blueprint/*.ts, App.tsx as of Wave 2 (read-only)
**Produces:** wrapper-component-instantiation audit report
**Owns exclusively:** none (report-only)

**Goal**: Verify all 24 Dashboard/Editor/Intake pages correctly instantiate `RecordDashboard`, `RecordEditor`, and `RecordIntake` wrapper components with matching type parameters, blueprints, and API instances. Detect any type slug mismatches, incorrect blueprint imports, or API creation inconsistencies.

**Context**: The QA Brain app has 8 record types (sop, cap, incident, change, audit, training, meeting, notes), each with 3 pages (Dashboard, Editor, Intake) = 24 pages total. These pages wrap three generic components that accept type-specific parameters. The audit ensures:
- Type slug (e.g., 'cap') matches the route path segment (`/cap`, `/cap/new`, `/cap/:filename`)
- API is instantiated with the correct type name: `createRecordApi('cap')`
- Blueprint is imported and used correctly for Editor/Intake pages
- Type parameter passed to wrapper matches the API name and route slug
- No cross-type mismatches (e.g., passing `type='cap'` with `sopApi`)

## Files to Audit

**Wrapper Components** (read-only reference):
- `app/frontend/src/components/RecordDashboard.tsx` — accepts `api`, `title`, `type`, `renderExtraCharts?`
- `app/frontend/src/components/RecordEditor.tsx` — accepts `api`, `blueprint`, `filename`, `type`, `renderExtraActions?`, `renderExtra?`
- `app/frontend/src/components/RecordIntake.tsx` — accepts `api`, `blueprint`, `onSave`, `initialRawText?`, `initialTitle?`, `initialFields?`

**Page Files to Audit** (24 total):
- `app/frontend/src/pages/AuditDashboard.tsx`, `AuditEditor.tsx`, `AuditIntake.tsx`
- `app/frontend/src/pages/CapDashboard.tsx`, `CapEditor.tsx`, `CapIntake.tsx`
- `app/frontend/src/pages/ChangeDashboard.tsx`, `ChangeEditor.tsx`, `ChangeIntake.tsx`
- `app/frontend/src/pages/IncidentDashboard.tsx`, `IncidentEditor.tsx`, `IncidentIntake.tsx`
- `app/frontend/src/pages/MeetingDashboard.tsx`, `MeetingEditor.tsx`, `MeetingIntake.tsx`
- `app/frontend/src/pages/NoteEditor.tsx`, `NoteIntake.tsx`, `NotesDashboard.tsx`
- `app/frontend/src/pages/SopEditor.tsx`
- `app/frontend/src/pages/TrainingDashboard.tsx`, `TrainingEditor.tsx`, `TrainingIntake.tsx`
- `app/frontend/src/pages/Dashboard.tsx` (SOP variant)
- `app/frontend/src/pages/Intake.tsx` (SOP variant)

**Blueprint Files** (reference):
- `app/frontend/src/blueprint/{auditBlueprint, capBlueprint, changeBlueprint, incidentBlueprint, meetingBlueprint, notesBlueprint, sopBlueprint, trainingBlueprint}.ts`

**Routing Configuration**:
- `app/frontend/src/App.tsx` — defines route paths and their expected type slugs (lines 93–117)

## Verification Checklist

For each of the 24 pages, verify:

### Dashboard Pages (8 total)
**Pattern**: `AuditDashboard.tsx`, `CapDashboard.tsx`, etc.
- [ ] **API Name**: `createRecordApi('type-slug')` where type-slug matches the page name (e.g., `CapDashboard` → `createRecordApi('cap')`)
- [ ] **Type Parameter**: `type="type-slug"` passed to `<RecordDashboard>` matches the API name
- [ ] **Title Parameter**: `title` prop is human-readable name matching convention (e.g., 'CAP', 'Audit', 'Training')
- [ ] **Route Consistency**: Type slug in page matches route path in `App.tsx` (e.g., `/cap` → `CapDashboard`, `/audit` → `AuditDashboard`)
- [ ] **Extra Charts**: If page renders extra charts (e.g., `renderExtraCharts` in `CapDashboard`), ensure chart queries are consistent with the record type

### Editor Pages (8 total)
**Pattern**: `AuditEditor.tsx`, `CapEditor.tsx`, etc.
- [ ] **API Name**: `createRecordApi('type-slug')` consistent with page name
- [ ] **Blueprint Import**: Correct blueprint imported, e.g., `import { capBlueprint } from '../blueprint/capBlueprint'`
- [ ] **Blueprint Export**: Blueprint exports `<typeName>Blueprint` array of `BlueprintField[]` objects
- [ ] **Type Parameter**: `type="type-slug"` passed to `<RecordEditor>` matches API name
- [ ] **Navigation Path**: Delete/cancel navigation uses correct type slug, e.g., `navigate(\`/${type}\`)`
- [ ] **Render Extra**: If page renders extra content (e.g., `RelatedRecordsGraph`), ensure imports are present and props are correct

### Intake Pages (8 total)
**Pattern**: `AuditIntake.tsx`, `CapIntake.tsx`, etc.
- [ ] **API Name**: `createRecordApi('type-slug')` consistent with page name
- [ ] **Blueprint Import**: Correct blueprint imported and passed to `<RecordIntake>`
- [ ] **onSave Handler**: Handler navigates to correct type slug, e.g., `navigate(\`/${type}/${created.filename}\`)`
- [ ] **Route Consistency**: Page mounted at `/{type}/new` in `App.tsx`

### Cross-Page Patterns
- [ ] **No Cross-Type Mismatches**: No page creates API for type A and passes type B to wrapper (e.g., `createRecordApi('cap')` with `type="sop"`)
- [ ] **Blueprint Consistency**: Each record type uses only its own blueprint (no `capBlueprint` in `SopEditor`, etc.)
- [ ] **API Singleton Pattern**: Each page file creates its API at module level (not per-render) — this is already done, just confirm pattern holds

## Execution Steps

### Step 1: Systematic File Audit Script
Create a lightweight verification script (or manual review) to check all 24 pages:

**For each Dashboard page:**
1. Extract the `createRecordApi('type-slug')` call
2. Verify `type-slug` matches the page filename (case-insensitive comparison: `CapDashboard` → `cap`, `AuditDashboard` → `audit`)
3. Confirm `type` prop in wrapper matches the API name
4. Verify route path in `App.tsx` uses the same type slug

**For each Editor page:**
1. Extract the `createRecordApi('type-slug')` call
2. Verify the imported blueprint name matches the type slug (e.g., `CapEditor` imports `capBlueprint`)
3. Confirm blueprint is passed to `<RecordEditor>`
4. Verify `type` prop matches API name

**For each Intake page:**
1. Extract the `createRecordApi('type-slug')` call
2. Verify blueprint import matches type slug
3. Confirm `onSave` handler navigates using the same type slug

### Step 2: Spot-Check High-Risk Pages
Priority: Pages with extra rendering logic or non-standard patterns.
- **CapDashboard**: Has `renderExtraCharts` prop with `FunnelChart` for CAP-specific effectiveness funnel → verify chart data function is type-safe
- **NotesDashboard/NoteEditor/NoteIntake**: Notes are exempt from lifecycle (`status`, `department`) — verify blueprint and wrapper usage handles this correctly
- **Dashboard.tsx** (SOP variant): Older/legacy file → verify uses same pattern as other Dashboard pages
- **Intake.tsx** (SOP variant): Older/legacy file → verify uses same pattern as other Intake pages

### Step 3: Verify Blueprint Exports
For each blueprint file, confirm:
1. File exports a `<typeName>Blueprint` variable (e.g., `capBlueprint`, `sopBlueprint`)
2. Export is an array of `BlueprintField[]` objects
3. Blueprint is imported in the correct Editor and Intake pages only

**Sample verification command** (for one type):
```bash
grep -l "capBlueprint" app/frontend/src/pages/*.tsx
# Should return exactly: CapEditor.tsx, CapIntake.tsx (not SopEditor, not AuditEditor, etc.)
```

### Step 4: Verify App.tsx Route Definitions
Cross-reference each page against `App.tsx` lines 93–117:
- For each type slug in routing (e.g., `/cap`), confirm:
  - `CapDashboard` component is imported and mounted at `/cap`
  - `CapIntake` component is imported and mounted at `/cap/new`
  - `CapEditor` route wrapper is imported and mounted at `/cap/:filename`
  - All three use the same type slug in their component code

### Step 5: Check for Typos and Edge Cases
Manual inspection for common errors:
- [ ] No typos in type slugs (e.g., `createRecordApi('capp')` or `type="Cap"` instead of `type="cap"`)
- [ ] No copy-paste errors where a page was cloned but type names weren't fully updated
- [ ] No stale imports of removed blueprints or API functions
- [ ] No mixing of related_documents (Editor/Intake) with folder filtering (Dashboard) — these are separate record metadata

## Expected Findings

If the audit is clean, all 24 pages will follow this pattern:
```tsx
// For record type 'X':
const xApi = createRecordApi('x');  // API name matches type slug

export function XDashboard() {
  return <RecordDashboard api={xApi} title="X" type="x" />;
}

export function XEditor({ filename }) {
  return <RecordEditor api={xApi} blueprint={xBlueprint} filename={filename} type="x" />;
}

export function XIntake() {
  const navigate = useNavigate();
  const handleSave = async (fm, body) => {
    const created = await xApi.create(fm, body);
    navigate(`/x/${created.filename}`);  // Navigation uses type slug 'x'
  };
  return <RecordIntake api={xApi} blueprint={xBlueprint} onSave={handleSave} />;
}
```

Deviations from this pattern are findings.

## Reporting Format

Document findings as a structured list with severity:
- **Critical**: Type mismatches (API for type A, wrapper for type B) — likely runtime bugs
- **High**: Missing/wrong blueprint imports — form rendering breaks
- **Medium**: Inconsistent title capitalization or missing extra chart rendering — affects UX consistency
- **Low**: Unused imports or minor code style — technical debt

## Verification Checklist (Summary)

- [ ] All 24 pages reviewed (8 Dashboard, 8 Editor, 8 Intake)
- [ ] No cross-type API/wrapper mismatches found
- [ ] All blueprints correctly imported in Editor/Intake pages
- [ ] All navigation paths use correct type slugs
- [ ] App.tsx routes align with component implementations
- [ ] No typos or copy-paste errors in type names
- [ ] Special handling for Notes (lifecycle exemption) is consistent
- [ ] Special rendering (CAP funnel, etc.) is correctly wired to the right pages

## Acceptance Criteria

Audit passes when:
1. All 24 pages have been reviewed and their instantiation verified
2. No critical mismatches detected
3. All type slugs are consistent across API, wrapper, route, and navigation
4. Blueprints are correctly imported and used
5. Any non-standard patterns (Notes lifecycle exemption, extra charts) are intentional and documented
