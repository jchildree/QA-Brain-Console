# Navigation Links & API Endpoint Consistency Audit

**Wave:** 3 (parallel with other Wave 3 audits; runs after Wave 2 routing/naming changes land)
**Consumes:** App.tsx / AppShell.tsx / config.js as of Wave 2 (read-only unless mismatches found)
**Produces:** nav/API-endpoint consistency audit report
**Owns exclusively:** none unless mismatches found (report-only by default)

**Goal**: Verify that AppShell.tsx navigation links match routes in App.tsx, and that all 24 record pages use correct API endpoint type slugs matching the backend config.

**Context**: The frontend defines record page types (SOP, CAP, Incident, etc.) in three views per type (Dashboard, Editor, Intake). Each page calls `createRecordApi(typeSlug)` which builds API calls like `/api/{typeSlug}/...`. The backend defines authoritative endpoint slugs in `app/backend/src/config.js` under `RECORD_TYPES`. An inconsistency here (e.g., `createRecordApi('sop')` vs. backend config's `urlSlug: 'sops'`) silently breaks record loading/saving.

**Files involved**:
- Source of truth: `app/backend/src/config.js` (lines 11–20, RECORD_TYPES object)
- Navigation definition: `app/frontend/src/components/AppShell.tsx` (BASE_NAV_LINKS, line 5–18)
- Route definitions: `app/frontend/src/App.tsx` (Route elements, lines 93–121)
- Record pages: 24 `.tsx` files in `app/frontend/src/pages/` (Dashboards, Editors, Intakes for 8 types + special pages)
- API client: `app/frontend/src/api/client.ts` (createRecordApi function, line 152)

---

## Part 1: Navigation Links Audit

### Step 1.1 – Extract navigation targets
Read `app/frontend/src/components/AppShell.tsx` and list all 12 entries in BASE_NAV_LINKS with their `to` paths:
1. Overview → `/`
2. SOP → `/sop`
3. CAP → `/cap`
4. Incident → `/incident`
5. Change → `/change`
6. Audit → `/audit`
7. Training → `/training`
8. Meeting Minutes → `/meeting`
9. Notes → `/notes`
10. Evidence Library → `/evidence`
11. Trash → `/trash`
12. Settings → `/settings`

Plus conditional (admin only):
13. Users → `/admin/users`

### Step 1.2 – Verify routes exist
Read `app/frontend/src/App.tsx` and confirm every path in BASE_NAV_LINKS has a matching Route element. Expected routes:
- `/` → `<Overview />`
- `/sop` → `<Dashboard />`
- `/cap` → `<CapDashboard />`
- `/incident` → `<IncidentDashboard />`
- `/change` → `<ChangeDashboard />`
- `/audit` → `<AuditDashboard />`
- `/training` → `<TrainingDashboard />`
- `/meeting` → `<MeetingDashboard />`
- `/notes` → `<NotesDashboard />`
- `/evidence` → `<EvidenceLibraryPage />`
- `/trash` → `<TrashPage />`
- `/settings` → `<SettingsPage />`
- `/admin/users` → `<AdminUsersPage />`

**Verification check**: Run `grep "path=" app/frontend/src/App.tsx` and confirm each nav path has a matching route.

---

## Part 2: API Endpoint Type Slug Audit

### Step 2.1 – Extract authoritative backend slugs
Read `app/backend/src/config.js` lines 11–20 and list RECORD_TYPES with their `urlSlug` values:

| Type | Backend Config Key | Correct `urlSlug` |
|------|-------------------|-------------------|
| SOP | `sop` | `sops` ← **plural** |
| CAP | `cap` | `cap` |
| Incident | `incident` | `incident` |
| Change | `change` | `change` |
| Audit | `audit` | `audit` |
| Training | `training` | `training` |
| Meeting | `meeting` | `meeting` |
| Notes | `notes` | `notes` ← **plural** |

### Step 2.2 – Audit all 24 record pages
For each record type, check 3 pages (Dashboard, Editor, Intake). Verify the `createRecordApi()` argument matches the backend's `urlSlug`.

**SOP pages** (3 files):
- `app/frontend/src/pages/SopEditor.tsx` → should use `'sops'`
- `app/frontend/src/pages/Dashboard.tsx` → should use `'sops'` (the main SOP dashboard)
- `app/frontend/src/pages/Intake.tsx` → should use `'sops'` (the main SOP intake)

**CAP pages** (3 files):
- `app/frontend/src/pages/CapEditor.tsx` → should use `'cap'`
- `app/frontend/src/pages/CapDashboard.tsx` → should use `'cap'`
- `app/frontend/src/pages/CapIntake.tsx` → should use `'cap'`

**Incident pages** (3 files):
- `app/frontend/src/pages/IncidentEditor.tsx` → should use `'incident'`
- `app/frontend/src/pages/IncidentDashboard.tsx` → should use `'incident'`
- `app/frontend/src/pages/IncidentIntake.tsx` → should use `'incident'`

**Change pages** (3 files):
- `app/frontend/src/pages/ChangeEditor.tsx` → should use `'change'`
- `app/frontend/src/pages/ChangeDashboard.tsx` → should use `'change'`
- `app/frontend/src/pages/ChangeIntake.tsx` → should use `'change'`

**Audit pages** (3 files):
- `app/frontend/src/pages/AuditEditor.tsx` → should use `'audit'`
- `app/frontend/src/pages/AuditDashboard.tsx` → should use `'audit'`
- `app/frontend/src/pages/AuditIntake.tsx` → should use `'audit'`

**Training pages** (3 files):
- `app/frontend/src/pages/TrainingEditor.tsx` → should use `'training'`
- `app/frontend/src/pages/TrainingDashboard.tsx` → should use `'training'`
- `app/frontend/src/pages/TrainingIntake.tsx` → should use `'training'`

**Meeting pages** (3 files):
- `app/frontend/src/pages/MeetingEditor.tsx` → should use `'meeting'`
- `app/frontend/src/pages/MeetingDashboard.tsx` → should use `'meeting'`
- `app/frontend/src/pages/MeetingIntake.tsx` → should use `'meeting'`

**Notes pages** (3 files):
- `app/frontend/src/pages/NoteEditor.tsx` → should use `'notes'`
- `app/frontend/src/pages/NotesDashboard.tsx` → should use `'notes'`
- `app/frontend/src/pages/NoteIntake.tsx` → should use `'notes'`

**Overview & utility pages** (Extra verification):
- `app/frontend/src/pages/Overview.tsx` → defines RECORD_TYPES_INFO array with type, urlSlug, and createRecordApi() calls (line ~16–27). Must cross-check:
  - `{ type: 'sop', urlSlug: 'sops', ... api: createRecordApi('sops') }`
  - `{ type: 'cap', urlSlug: 'cap', ... api: createRecordApi('cap') }`
  - etc. for all 7 record types

**Execution**:
1. Run: `grep -n "createRecordApi" app/frontend/src/pages/*.tsx | grep -v test.tsx`
2. For each match, verify the slug inside `createRecordApi('...')` matches the backend config.
3. Create a matrix (see Verification section) showing the check result.

### Step 2.3 – Check type parameter consistency
Some pages also pass a `type` prop to their components. Verify:
- SopEditor: `type="sop"`
- CapEditor: `type="cap"`
- IncidentEditor: `type="incident"`
- ChangeEditor: `type="change"`
- AuditEditor: `type="audit"`
- TrainingEditor: `type="training"`
- MeetingEditor: `type="meeting"`
- NoteEditor: `type="note"` (singular, not `notes`)

These `type` values should match the keys in backend RECORD_TYPES (e.g., `sop`, `cap`, etc.), not the `urlSlug`. They control display labels and blueprint selection.

---

## Verification Steps

### Verification Matrix Template
Create a CSV or markdown table to track:

```
File | Type | Expected urlSlug | Actual createRecordApi() Call | Status | Notes
-----|------|-------------------|-------------------------------|--------|-------
app/frontend/src/pages/SopEditor.tsx | SOP | sops | 'sops' | ✓ | OK
app/frontend/src/pages/CapEditor.tsx | CAP | cap | 'cap' | ✓ | OK
app/frontend/src/pages/IncidentEditor.tsx | Incident | incident | 'incident' | ✓ | OK
...
```

### Run this grep command to extract all createRecordApi calls:
```bash
grep -rn "createRecordApi" app/frontend/src/pages/ --include="*.tsx" | grep -v test.tsx
```

Cross-reference each result:
1. Extract the page filename
2. Identify the record type from filename (e.g., "SopEditor" → SOP)
3. Extract the slug from `createRecordApi('...')`
4. Look up the expected slug in the backend config (Step 2.1)
5. Mark as ✓ (match) or ✗ (mismatch) with the expected value

### Expected finding:
All 24 pages should have the correct slug. Known inconsistencies (if any) suggest:
- Typo in a page's createRecordApi() call
- Backend config out of sync with frontend
- A new record type added to one system but not the other

### Run one integration test:
1. Start the backend: `cd app/backend && npm start`
2. Start the frontend: `cd app/frontend && npm run dev`
3. Open the browser console (F12)
4. Click each nav link and verify no API 404 errors appear (e.g., "Failed to load" messages)
5. Check network tab to confirm requests go to the correct endpoints (e.g., `/api/sops/`, `/api/cap/`, etc.)

---

## Reporting & Follow-up

### Expected outcomes:
1. **All passing**: Navigation and API endpoints are consistent. Document the baseline.
2. **Mismatches found**: For each mismatch, determine root cause:
   - Is the backend config wrong (should be updated)?
   - Is a page's createRecordApi() call wrong (needs a fix)?
   - Is both directions wrong (upstream service changed)?

### If mismatches are found:
1. Create separate issues for each type of fix (backend vs. frontend).
2. Ensure related_documents searches and blueprint assignments also use the correct type slugs.
3. Test end-to-end (create, read, update, delete) for any changed type.

### Files to update (if needed):
- `app/backend/src/config.js` – if backend config slug is wrong
- `app/frontend/src/pages/` – if frontend createRecordApi() calls are wrong
- `app/frontend/src/pages/Overview.tsx` – if RECORD_TYPES_INFO array needs updates
- Any tests that hard-code API slugs (search test files)

---

## Time estimate
- **Part 1 (navigation)**: 10–15 minutes (visual scan + grep)
- **Part 2 (API endpoints)**: 30–45 minutes (grep all 24 pages, cross-reference config, fill matrix)
- **Integration test**: 10 minutes (manual browser checks)
- **Reporting**: 10 minutes (document findings, create issues if needed)

**Total**: ~60–80 minutes for a thorough audit with fixes.
