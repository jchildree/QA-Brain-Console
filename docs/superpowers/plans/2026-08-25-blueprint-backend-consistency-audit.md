# Blueprint vs Backend fieldSchemas Consistency Audit & Fixes

**Wave:** 2 (parallel with blueprint-coverage-naming-audit)
**Consumes:** app/frontend/src/api/fieldSchemas.js (read-only, backend-owned)
**Produces:** blueprint field fixes; required-field validation in RecordEditor.handleSave
**Owns exclusively:** app/frontend/src/blueprint/incidentBlueprint.ts, changeBlueprint.ts, notesBlueprint.ts, app/frontend/src/components/RecordEditor.tsx (validation block only)

**Date:** 2026-08-25  
**Depth:** 3 (executable plan)  
**Scope:** Audit all 8 record-type blueprints against backend fieldSchemas, templates, and rendering layer; identify and fix mismatches.

---

## Goal

Ensure consistency between:
1. **Frontend blueprints** (`app/frontend/src/blueprint/*Blueprint.ts`) — define UI field rendering, types, and required flags
2. **Backend fieldSchemas** (`app/backend/src/fieldSchemas.js`) — describe AI extraction guidance for note intake
3. **Vault templates** (`qa-brain/_templates/*.md`) — ground truth for actual frontmatter structure
4. **Rendering layer** (`app/frontend/src/components/DynamicForm.tsx`, `RecordEditor.tsx`) — ensure all field types render correctly and validation is in place

Result: No silent field mismatches, all blueprints match template reality, and all required-field validation is enforced.

---

## Context

### Three Sources of Truth

**Blueprints** (frontend UI contract):
- 8 files: `sopBlueprint.ts`, `capBlueprint.ts`, `incidentBlueprint.ts`, `changeBlueprint.ts`, `auditBlueprint.ts`, `trainingBlueprint.ts`, `meetingBlueprint.ts`, `notesBlueprint.ts`
- Each is a `BlueprintField[]` array defining: `key`, `label`, `type` (text|select|date|tags|related|user|owner), `options?`, `required?`
- ~144 lines total, small and easy to verify

**Templates** (vault ground truth):
- 7 files (notes.md not in templates): `SOP.md`, `CAP.md`, `INCIDENT.md`, `CHANGE.md`, `AUDIT.md`, `TRAINING.md`, `MEETING.md`
- Each defines frontmatter schema via actual fields in the template YAML block
- Common fields: `id`, `type`, `status`, `version`, `owner`, `created`, `modified`, `approved_by`, `effective_date`, `review_date`, `department`, `tags`, `related_documents`, `related_records`, `source`
- Type-specific fields: `root_cause`, `effectiveness_status` (CAP); `severity`, `root_cause`, `description`, `detection_method` (INCIDENT); `change_description`, `reason_for_change` (CHANGE); `audit_type`, `scope` (AUDIT); `employee_name`, `role` (TRAINING); `folder`, `attendees`, `meeting_date` (MEETING)

**fieldSchemas.js** (AI extraction guidance for note intake):
- `FIELD_SCHEMAS`: Describes which fields the AI should extract for each type. Example: SOP expects `purpose` and `scope` (these are **section-extraction hints for the AI**, not frontmatter keys; the blueprint doesn't need them)
- `UNIVERSAL_FIELDS`: Common fields all types should extract (`title`, `status`, `version`, `related_documents`)
- Used by `anthropicProvider.js` in the `/intake/extract` endpoint to prompt Claude on what to extract from raw pasted text

**Rendering Layer**:
- `DynamicForm.tsx` (~350 lines): Renders each blueprint field based on type. Handlers: `select` → `<select>`, `related` → `RelatedDocumentsPicker`, `user` → `AssigneePicker` (dropdown), `owner` → `OwnerPicker` (autocomplete), `tags` → comma-separated input, else `text`/`date` → native inputs
- `RecordEditor.tsx` (~150 lines): Wraps DynamicForm + body textarea. **Currently has NO validation for required fields before save**; backend route also has no validation

### Key Insight: fieldSchemas False Positives

The task description warns against false positives. Confirmed: fields like `purpose`, `scope`, `description`, `detection_method` in fieldSchemas are **AI extraction section labels**, not frontmatter keys that blueprints must render. They exist because the AI looks for these sections in raw text and extracts summary text to populate frontmatter.

For example, SOP fieldSchemas says `purpose (short string)` — this tells Claude to look for a "Purpose" section and extract a summary. But the SOP template has no `purpose` frontmatter field (it has a section, not a field). The blueprint correctly does NOT include `purpose` as a field to render. **This is NOT a bug.**

---

## Audit Method

For each of the 8 record types:
1. **Extract blueprint fields**: List all `BlueprintField.key` values from the blueprint
2. **Extract template fields**: List all frontmatter keys from the template YAML
3. **Extract fieldSchemas entry**: Note what's in `FIELD_SCHEMAS[type]` for context (AI extraction hints; not frontmatter keys)
4. **Compare**: 
   - Are all template frontmatter keys present in the blueprint? (If not, that's a blueprint gap)
   - Are all blueprint keys present in the template? (If not, that's a blueprint error or a template gap)
   - Are select options in the blueprint consistent with CLAUDE.md controlled vocabulary? (Draft|In Review|Approved|Obsolete for status; QC|QA|IT|Operations for department; etc.)
5. **Rendering check**: Does DynamicForm have a handler for each field type used in the blueprint?
6. **Validation check**: Does RecordEditor validate required fields before save?

---

## Audit Findings

### 1. SOP (sopBlueprint.ts vs SOP.md template)

**Blueprint fields:**
```
id, title, status, version, owner, approved_by, effective_date, review_date, 
department, tags, related_documents
```

**Template fields:**
```
id, type, status, version, owner, created, modified, approved_by, effective_date, 
review_date, department, tags, related_documents, related_records, source
```

**fieldSchemas hint:** `purpose (short string), scope (short string)` — AI extraction labels, not frontmatter

**Findings:**
- ✗ Blueprint missing: `created`, `modified`, `related_records`, `source`
- ✓ All blueprint fields are in template
- ✓ Select options match CLAUDE.md vocabulary (status: Draft|In Review|Approved|Obsolete; department: QC|QA|IT|Operations)
- ✓ Field types correct (status/department are select, dates are date, etc.)

**Verdict:** MISSING FIELDS in blueprint (created, modified, related_records, source)

---

### 2. CAP (capBlueprint.ts vs CAP.md template)

**Blueprint fields:**
```
id, title, status, version, owner, approved_by, effective_date, review_date, 
department, tags, root_cause, effectiveness_status, related_documents
```

**Template fields:**
```
id, type, status, version, owner, created, modified, approved_by, effective_date, 
review_date, department, tags, related_documents, related_records, source, root_cause, 
effectiveness_status
```

**fieldSchemas hint:** `root_cause (short string), effectiveness_status (one of Pending, Pass, Fail, N/A)` — actual frontmatter fields

**Findings:**
- ✗ Blueprint missing: `created`, `modified`, `related_records`, `source`
- ✓ All blueprint fields are in template
- ✓ effectiveness_status options match template default (Pending)
- ✓ Field types correct

**Verdict:** MISSING FIELDS in blueprint (created, modified, related_records, source)

---

### 3. INCIDENT (incidentBlueprint.ts vs INCIDENT.md template)

**Blueprint fields:**
```
id, title, status, version, owner, approved_by, effective_date, review_date, 
department, tags, description, detection_method, severity, root_cause, related_documents
```

**Template fields:**
```
id, type, status, version, owner, created, modified, approved_by, effective_date, 
review_date, department, tags, severity, root_cause, related_documents, related_records, source
```

**fieldSchemas hint:** `description (short string), detection_method (short string), severity (one of Low, Medium, High, Critical), root_cause (short string)` — mixed; description/detection_method are extraction hints, severity/root_cause are frontmatter

**Findings:**
- ✗ Blueprint includes `description` and `detection_method` — these are NOT frontmatter fields in the template; they're AI extraction hints from body sections
- ✗ Blueprint missing: `created`, `modified`, `related_records`, `source`
- ✓ severity and root_cause are correct
- ✓ Field types correct

**Verdict:** EXTRA FIELDS in blueprint (description, detection_method should be removed); MISSING FIELDS (created, modified, related_records, source)

---

### 4. CHANGE (changeBlueprint.ts vs CHANGE.md template)

**Blueprint fields:**
```
id, title, status, version, owner, approved_by, effective_date, review_date, 
department, tags, change_description, reason_for_change, related_documents
```

**Template fields:** (checking CHANGE.md)
```
id, type, status, version, owner, created, modified, approved_by, effective_date, 
review_date, department, tags, related_documents, related_records, source
```

**fieldSchemas hint:** `change_description (short string), reason_for_change (short string)` — AI extraction hints

**Findings:**
- ✗ Blueprint includes `change_description` and `reason_for_change` — these are NOT frontmatter fields in the template; they're AI extraction hints
- ✗ Blueprint missing: `created`, `modified`, `related_records`, `source`

**Verdict:** EXTRA FIELDS in blueprint (change_description, reason_for_change); MISSING FIELDS (created, modified, related_records, source)

---

### 5. AUDIT (auditBlueprint.ts vs AUDIT.md template)

**Blueprint fields:**
```
id, title, status, version, owner, approved_by, effective_date, review_date, 
department, tags, audit_type, scope, related_documents
```

**Template fields:** (checking AUDIT.md)
```
id, type, status, version, owner, created, modified, approved_by, effective_date, 
review_date, department, tags, related_documents, related_records, source, audit_type, scope
```

**fieldSchemas hint:** `audit_type (one of Internal, External, Supplier), scope (short string)` — actual frontmatter fields

**Findings:**
- ✗ Blueprint missing: `created`, `modified`, `related_records`, `source`
- ✓ All blueprint fields are in template
- ✓ audit_type options match (Internal|External|Supplier)
- ✓ Field types correct

**Verdict:** MISSING FIELDS in blueprint (created, modified, related_records, source)

---

### 6. TRAINING (trainingBlueprint.ts vs TRAINING.md template)

**Blueprint fields:**
```
id, title, status, version, owner, approved_by, effective_date, review_date, 
department, tags, employee_name, role, related_documents
```

**Template fields:** (checking TRAINING.md)
```
id, type, status, version, owner, created, modified, approved_by, effective_date, 
review_date, department, tags, related_documents, related_records, source, employee_name, role
```

**fieldSchemas hint:** `employee_name (short string), role (short string)` — actual frontmatter fields

**Findings:**
- ✗ Blueprint missing: `created`, `modified`, `related_records`, `source`
- ✓ All blueprint fields are in template
- ✓ Field types correct

**Verdict:** MISSING FIELDS in blueprint (created, modified, related_records, source)

---

### 7. MEETING (meetingBlueprint.ts vs MEETING.md template)

**Blueprint fields:**
```
id, title, status, version, owner, approved_by, effective_date, review_date, 
department, folder, tags, attendees, meeting_date, related_documents
```

**Template fields:**
```
id, type, status, version, owner, created, modified, approved_by, effective_date, 
review_date, department, folder, tags, attendees, meeting_date, related_documents, related_records, source
```

**Findings:**
- ✗ Blueprint missing: `created`, `modified`, `related_records`, `source`
- ✓ All blueprint fields are in template
- ✓ `folder` is present (good; notesBlueprint also has this)
- ✓ Field types correct

**Verdict:** MISSING FIELDS in blueprint (created, modified, related_records, source)

---

### 8. NOTES (notesBlueprint.ts)

**Blueprint fields (regular user):**
```
id, title, folder, tags, related_documents
```

**Blueprint fields (admin variant):**
```
...same... plus assigned_to
```

**Template fields:** (no template; notes are special — they have no status/department/version/owner frontmatter)

**Findings:**
- ✓ Notes are simpler by design (no lifecycle, no approval, no department)
- ✓ `folder` field present
- ✗ Blueprint missing: `created`, `modified` (should these be added for notes? Check vault usage)

**Verdict:** MISSING FIELDS in blueprint (created, modified — though unclear if notes should have these; requires vault inspection)

---

### Rendering & Validation Audit

**DynamicForm.tsx field type handlers:**
- `select` ✓ (implemented)
- `related` ✓ (RelatedDocumentsPicker)
- `user` ✓ (AssigneePicker dropdown)
- `owner` ✓ (OwnerPicker autocomplete)
- `tags` ✓ (comma-separated input)
- `text` ✓ (native input)
- `date` ✓ (native date input)

All field types have handlers. ✓

**Required-field validation:**
- DynamicForm.tsx: Renders `*` asterisk next to `required: true` fields (cosmetic only; no validation logic)
- RecordEditor.tsx: **NO validation before save**. Calls `api.save()` directly with whatever frontmatter is provided
- Backend `routes/records.js`: **NO validation**. Accepts any frontmatter in PUT/POST, just writes it

**Verdict:** ✗ MISSING: Required-field validation logic. RecordEditor.tsx should validate before calling `api.save()`.

---

## Summary of Mismatches

| Issue | Type | Scope |
|-------|------|-------|
| Missing `created`, `modified`, `related_records`, `source` in all 8 blueprints | Field gap | Blueprints (SOP, CAP, INCIDENT, CHANGE, AUDIT, TRAINING, MEETING) |
| Extra `description`, `detection_method` in incidentBlueprint | False positive | incidentBlueprint.ts |
| Extra `change_description`, `reason_for_change` in changeBlueprint | False positive | changeBlueprint.ts |
| Missing `created`, `modified` in notesBlueprint (unclear if needed) | Field gap | notesBlueprint.ts |
| No required-field validation in RecordEditor | Validation gap | RecordEditor.tsx, backend routes/records.js |

---

## Fixes

### Fix 1: Add metadata fields to all blueprints except notes

These fields exist in all templates and are set by the system (Templater auto-populates `created`/`modified`, `related_records` is handled separately, `source` is hardcoded in templates). They should be read-only fields in the UI.

**Action:** Add to blueprints **as read-only text fields** (type='text' with no onChange, or skip rendering entirely if UI doesn't need to display them).

**Decision:** Do NOT add `created`, `modified`, `related_records`, `source` to blueprints. **Reason:**
- These are system-managed, not user-edited fields
- Blueprint is for user-editable fields in DynamicForm
- UI doesn't need to render them (Templater and auto-sync handle them)
- This matches the principle of "blueprint defines what the user controls in the UI"
- **Keeping them out of blueprints is CORRECT**

**Revised Verdict:** No fix needed for metadata fields. Blueprints are correct to exclude system-managed fields.

---

### Fix 2: Remove false-positive extraction fields from blueprints

**INCIDENT**: Remove `description` and `detection_method` from incidentBlueprint.ts
- These are AI extraction labels (Claude looks for Description/Detection Method sections in raw text)
- They are NOT frontmatter fields in the INCIDENT template
- **Exception:** Check if there are actual instances in qa-brain/ that have these fields; if so, keep them. Otherwise, remove.

**CHANGE**: Remove `change_description` and `reason_for_change` from changeBlueprint.ts
- Same reasoning: extraction labels, not frontmatter
- **Exception:** Check if there are actual instances; if so, keep.

**Action:** 
1. Search qa-brain/INCIDENT/ for records with `description:` or `detection_method:` in frontmatter → if found, these ARE used; keep them in blueprint. If none, remove.
2. Search qa-brain/CHANGE/ for records with `change_description:` or `reason_for_change:` → if found, keep; if none, remove.

---

### Fix 3: Clarify notes blueprint `created`/`modified`

Check actual note records in qa-brain/Notes/ to see if any have `created` or `modified` frontmatter fields. If yes, add them to notesBlueprint. If no, leave as-is.

---

### Fix 4: Add required-field validation to RecordEditor.tsx

Add a validation check in `handleSave()` before calling `api.save()`:
- For each field in blueprint with `required: true`, check that `frontmatter[field.key]` is not empty
- If any required field is empty, show error message (similar to existing `saveError` UI)
- Do NOT save until all required fields are filled

**Exact change location:** `app/frontend/src/components/RecordEditor.tsx`, line ~59-84 (the `handleSave` function)

```typescript
const handleSave = async () => {
  // NEW: Validate required fields
  const errors = blueprint
    .filter((field) => field.required)
    .filter((field) => !frontmatter[field.key] || 
                       (Array.isArray(frontmatter[field.key]) && frontmatter[field.key].length === 0))
    .map((field) => field.label);
  
  if (errors.length > 0) {
    setSaveError(`Required fields missing: ${errors.join(', ')}`);
    return;
  }
  
  // ... rest of existing save logic
};
```

---

## Verification Steps

### 1. Audit verification (automated or manual)

For each blueprint, print a comparison table:
```
RECORD TYPE: SOP
Blueprint fields:    [id, title, status, version, owner, ...]
Template fields:     [id, type, status, version, owner, ...]
In blueprint but not template:    NONE
In template but not blueprint:    [created, modified, related_records, source] (EXPECTED: system-managed)
Verdict:             PASS (system fields correctly excluded)
```

Do this for all 8 types. If the output matches the audit findings above, PASS.

### 2. Field-in-use verification (if false-positive fixes apply)

After determining whether to remove `description`, `detection_method`, `change_description`, `reason_for_change`:
```bash
# Search for actual instances
grep -r "description:" qa-brain/INCIDENT/ | grep -v "Detection Method"
grep -r "detection_method:" qa-brain/INCIDENT/
grep -r "change_description:" qa-brain/CHANGE/
grep -r "reason_for_change:" qa-brain/CHANGE/
```

If any results, KEEP those fields in blueprints. If no results, REMOVE them.

### 3. Rendering verification (manual UI test)

1. Start the app: `npm run dev` in app/frontend/
2. Navigate to a record editor (e.g., open an existing SOP or create a new one)
3. For each blueprint field type, verify:
   - `select`: Dropdown shows correct options
   - `date`: Date picker works
   - `tags`: Comma-separated input works (split on comma, render as chips)
   - `related`: Related documents picker shows dropdown with record IDs
   - `user` / `owner`: Autocomplete works
   - `text`: Text input works
4. No errors in browser console

### 4. Required-field validation verification (after Fix 4 applied)

1. Open a record editor
2. Identify a required field (marked with `required: true` in blueprint) — e.g., `status` or `department` for SOP
3. Try to save WITHOUT filling that field
4. **Expected:** Error message "Required fields missing: Status" (or similar) appears; record is NOT saved
5. Fill the field and try to save again
6. **Expected:** Record saves successfully

### 5. Intake flow verification (optional but recommended)

1. Go to the intake page (if exists)
2. Paste raw SOP/INCIDENT/etc. text
3. Click "Extract"
4. Verify that extracted frontmatter:
   - Has all UNIVERSAL_FIELDS (title, status, version, related_documents)
   - Has all type-specific fields as per FIELD_SCHEMAS
   - Does NOT have false-positive extraction fields as removed from blueprints
5. Save the extracted record
6. Verify the record displays correctly in the UI with all fields filled

---

## File Paths Summary

**Files to audit:** (read, analyze, no changes needed if findings match)
- `app/frontend/src/blueprint/sopBlueprint.ts`
- `app/frontend/src/blueprint/capBlueprint.ts`
- `app/frontend/src/blueprint/incidentBlueprint.ts`
- `app/frontend/src/blueprint/changeBlueprint.ts`
- `app/frontend/src/blueprint/auditBlueprint.ts`
- `app/frontend/src/blueprint/trainingBlueprint.ts`
- `app/frontend/src/blueprint/meetingBlueprint.ts`
- `app/frontend/src/blueprint/notesBlueprint.ts`
- `qa-brain/_templates/SOP.md`, `CAP.md`, `INCIDENT.md`, `CHANGE.md`, `AUDIT.md`, `TRAINING.md`, `MEETING.md`
- `app/backend/src/fieldSchemas.js`
- `app/frontend/src/components/DynamicForm.tsx`
- `app/frontend/src/components/RecordEditor.tsx`
- `app/backend/src/routes/records.js`

**Files to modify (if needed):**
- `app/frontend/src/blueprint/incidentBlueprint.ts` (remove `description`, `detection_method` if not in actual records)
- `app/frontend/src/blueprint/changeBlueprint.ts` (remove `change_description`, `reason_for_change` if not in actual records)
- `app/frontend/src/blueprint/notesBlueprint.ts` (add `created`, `modified` if they exist in actual note records)
- `app/frontend/src/components/RecordEditor.tsx` (add required-field validation logic)

**Files NOT to modify:**
- fieldSchemas.js (correct as-is; designed for AI extraction prompting, not frontmatter enumeration)
- Templates (already correct; audit confirms this)

---

## Next Steps (Decision Points)

**Before applying fixes:**

1. **Confirm system-field design:** Verify with team that `created`, `modified`, `related_records`, `source` are indeed system-managed and should NOT appear in blueprints. (Probably yes; this is correct UI design.)

2. **Check actual records for false-positive fields:**
   ```bash
   grep -r "description:\|detection_method:" C:\Users\jchildree\OneDrive*\Desktop\Projects\QA-Brain-Project\qa-brain\INCIDENT\
   grep -r "change_description:\|reason_for_change:" C:\Users\jchildree\OneDrive*\Desktop\Projects\QA-Brain-Project\qa-brain\CHANGE\
   grep -r "created:\|modified:" C:\Users\jchildree\OneDrive*\Desktop\Projects\QA-Brain-Project\qa-brain\Notes\
   ```
   
   Based on results, decide whether to remove/add fields.

3. **Decide required-field validation scope:** Should validation happen on frontend only (UX feedback)? Or also backend (data quality enforcement)? Current design has neither. **Recommendation:** Add to frontend for immediate UX feedback; consider backend validation if data-quality requirements are high (e.g., no approved record should have blank required fields).

---

## Conclusion

**Status:** Moderate cleanup needed.
- **No critical bugs:** Blueprints are functionally close to correct. The main issue is missing required-field validation, which is a usability gap, not a data integrity bug (users can still save records with blank fields).
- **Design correctness:** System-managed fields (created, modified, source) are correctly excluded from blueprints. This is good practice.
- **False positives in 2 blueprints:** INCIDENT and CHANGE include AI extraction labels as if they were frontmatter fields. These should be removed unless actual vault records use them.
- **Quick wins:** Fix 4 (validation) is the highest-value single change. Fixes 1-3 are clarifications with minimal code impact.

All fixes are low-risk and isolated to blueprint files and one UI component.
