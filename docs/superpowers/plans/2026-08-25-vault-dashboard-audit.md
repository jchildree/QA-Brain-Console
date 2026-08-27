# Vault Dashboard Audit -- Fix Dataview Queries and Template Drift

**Wave:** 1 (parallel with backend-audit-stabilization, card-component-rendering-edge-cases, audit-relatedRecords-test-coverage)
**Consumes:** none
**Produces:** corrected Dataview queries and template frontmatter alignment
**Owns exclusively:** qa-brain/_dashboards/*.md, qa-brain/_templates/*.md

## Goal

`qa-brain/_dashboards/*.md` Dataview queries and `qa-brain/_templates/*.md`
frontmatter have drifted from the frontmatter fields real records actually
carry. Fix every query that silently returns nothing, returns everything
unfiltered, queries the wrong scope, or displays an always-empty column --
and bring the Templater templates' frontmatter into line with the schema
records actually use.

## Context

This vault has two competing schema sources:

1. **`qa-brain/_templates/*.md`** (Templater templates) -- define fields
 `created`, `modified`, `source`, `owner: Joseph Childree` (hardcoded).
2. **`app/frontend/src/blueprint/*.ts`** (the QA-Brain console app's record
 schema, actively maintained -- see recent commits touching these files) --
 defines fields `owner` (type `owner`, a picker), `approved_by`,
 `effective_date`, `review_date`, `department`, `tags`,
 `related_documents`, plus per-type fields (`severity`/`root_cause` for
 INCIDENT, `effectiveness_status`/`root_cause` for CAP, `audit_type`/`scope`
 for AUDIT, `change_description`/`reason_for_change` for CHANGE,
 `attendees`/`meeting_date`/`folder` for MEETING, `employee_name`/`role`
 for TRAINING). **No `created`, `modified`, or `source` field exists in any
 blueprint.**

Real records on disk match the **blueprint** schema, not the template
schema -- confirmed by reading `qa-brain/INCIDENT/INC-20260731-001.md`,
`qa-brain/CHANGE/CHG-20260731-001.md`, `qa-brain/AUDIT/AUD-20260807-001.md`,
`qa-brain/MEETING/MTG-20260807-001.md`. All use `created_by`/`updated_by`
(person names), never `created`/`modified` (dates), and never `source`.
`status` values observed and blueprint-enforced: `Draft`, `In Review`,
`Approved`, `Obsolete` only (matches `CLAUDE.md`'s controlled vocabulary) --
**`Closed` is not a legal value and never appears**.

The vault root is the repo root: `.obsidian/` lives at
`C:\...\QA-Brain-Project\.obsidian`, and
`app/backend/src/config.js` resolves `VAULT_ROOT` to `<repo-root>/qa-brain`.
So Dataview `FROM` paths must be `"qa-brain/<Folder>"`, not
`"docs/qa-brain/<Folder>"` (there is no `qa-brain` under `docs/` -- `docs/`
contains an unrelated stale `Obsidian Vault/QA-Brain-Project` copy and other
docs, not the live record folders).

Folders currently populated: `AUDIT` (1), `CHANGE` (2), `INCIDENT` (1),
`MEETING` (10), `Notes` (~60+). Empty: `CAP` (0 real records), `SOP` (0),
`TRAINING` (1, `Zoho.md`, non-conforming -- no frontmatter matching the
blueprint, skip it as an outlier, don't special-case queries around it).

### Confirmed defects, file by file

**`qa-brain/_dashboards/Home.md`**
- Line 14 `FROM "docs/qa-brain/CAP"` → `FROM "qa-brain/CAP"`
- Line 15 `WHERE status != "Closed"` → `WHERE status != "Obsolete"`
- Line 16 `SORT created DESC` → `SORT file.ctime DESC` (no `created` field exists)
- Line 25 `FROM "docs/qa-brain/INCIDENT"` → `FROM "qa-brain/INCIDENT"`
- Line 26 `WHERE status != "Closed"` → `WHERE status != "Obsolete"`
- Line 27 `SORT created DESC` → `SORT file.ctime DESC`
- Line 36 `FROM "docs/qa-brain/SOP"` → `FROM "qa-brain/SOP"`
- Line 46 `FROM "docs/qa-brain/CHANGE"` → `FROM "qa-brain/CHANGE"`
- Line 56 `FROM "docs/qa-brain/TRAINING"` → `FROM "qa-brain/TRAINING"`
- Line 58 `SORT created DESC` → `SORT file.ctime DESC`
- Line 67 `FROM "docs/qa-brain/AUDIT"` → `FROM "qa-brain/AUDIT"`
- Line 68 `WHERE status != "Closed"` → `WHERE status != "Obsolete"`

**`qa-brain/_dashboards/CAP-Tracker.md`**
- Line 9 `FROM "docs/qa-brain/CAP"` → `FROM "qa-brain/CAP"`
- Line 10 `WHERE status != "Closed"` → `WHERE status != "Obsolete"`
- Line 20 `FROM "docs/qa-brain/CAP"` → `FROM "qa-brain/CAP"`
- Line 30 `TABLE related_records, ...` → `TABLE related_documents, ...`
 (blueprint field is `related_documents`; `related_records` is never
 populated on any record, so this column is always empty)
- Line 31 `FROM "docs/qa-brain/CAP"` → `FROM "qa-brain/CAP"`
- Line 32 `SORT created DESC` → `SORT file.ctime DESC`
- Line 41 `FROM "docs/qa-brain/CAP"` → `FROM "qa-brain/CAP"`

**`qa-brain/_dashboards/SOP-Control.md`**
- Line 9 `FROM "docs/qa-brain/SOP"` → `FROM "qa-brain/SOP"`
- Line 20 `FROM "docs/qa-brain/SOP"` → `FROM "qa-brain/SOP"`
- Line 31 `FROM "docs/qa-brain/SOP"` → `FROM "qa-brain/SOP"`
- Line 41 `TABLE version, modified, department` → `TABLE version, file.mtime AS "Modified", department`
 (`modified` is not a real field; every other dashboard already uses
 `file.mtime AS "..."` for this)
- Line 42 `FROM "docs/qa-brain/SOP"` → `FROM "qa-brain/SOP"`
- Line 43 `SORT modified DESC` → `SORT file.mtime DESC`
- Line 52 `TABLE related_records, ...` → `TABLE related_documents, ...`
- Line 53 `FROM "docs/qa-brain/SOP"` → `FROM "qa-brain/SOP"`
- Line 54 `WHERE related_records != null` → `WHERE related_documents != null`

**`qa-brain/_dashboards/Audit-Prep.md`**
- Line 9 `FROM "docs/qa-brain/AUDIT"` → `FROM "qa-brain/AUDIT"`
- Line 11 `SORT created DESC` → `SORT file.ctime DESC`
- Line 19 `TABLE related_records, ...` → `TABLE related_documents, ...`
- Line 20 `FROM "docs/qa-brain/AUDIT"` → `FROM "qa-brain/AUDIT"`
- Line 30 `FROM "docs/qa-brain/SOP" OR "docs/qa-brain/CAP" OR "docs/qa-brain/INCIDENT" OR "docs/qa-brain/CHANGE"`
 → `FROM "qa-brain/SOP" OR "qa-brain/CAP" OR "qa-brain/INCIDENT" OR "qa-brain/CHANGE"`
- Lines 39-41 "Recently Approved Documents" query has **no `FROM` clause at
 all** -- it currently scans the entire vault (dashboards, templates,
 Notes, everything), not just records. Add:
 `FROM "qa-brain/SOP" OR "qa-brain/CAP" OR "qa-brain/INCIDENT" OR "qa-brain/CHANGE" OR "qa-brain/AUDIT" OR "qa-brain/TRAINING"`
 as a new line between the `TABLE` line and the `WHERE` line.
- Line 51 `FROM "docs/qa-brain/TRAINING"` → `FROM "qa-brain/TRAINING"`

**`qa-brain/_dashboards/Incident-Trends.md`**
- Line 9 `FROM "docs/qa-brain/INCIDENT"` → `FROM "qa-brain/INCIDENT"`
- Line 11 `SORT created DESC` → `SORT file.ctime DESC`
- Line 20 `FROM "docs/qa-brain/INCIDENT"` → `FROM "qa-brain/INCIDENT"`
- Line 32 `FROM "docs/qa-brain/INCIDENT"` → `FROM "qa-brain/INCIDENT"`
- Line 43 `FROM "docs/qa-brain/INCIDENT"` → `FROM "qa-brain/INCIDENT"`
- Line 44 `WHERE !contains(related_records, "CAP") AND status != "Closed"`
 → `WHERE !contains(related_documents, "CAP") AND status != "Obsolete"`
- Line 54 `FROM "docs/qa-brain/INCIDENT"` → `FROM "qa-brain/INCIDENT"`
- Line 55 `WHERE status = "Closed" AND ...` -- there is no `Closed` status, so
 this "Closed This Month" section can never match anything under the real
 vocabulary. Rename the section to **"Obsoleted This Month"** and change
 the condition to `WHERE status = "Obsolete" AND file.mtime >= date(today) - dur(30 days)`.

### Template frontmatter drift (informational + fix)

All seven templates in `qa-brain/_templates/` (`SOP.md`, `CAP.md`,
`INCIDENT.md`, `CHANGE.md`, `AUDIT.md`, `TRAINING.md`, `MEETING.md`) declare
`created`, `modified`, and (all but SOP) `source` frontmatter fields that:
- don't exist in the console app's blueprint schema
 (`app/frontend/src/blueprint/*.ts`), and
- don't appear in any real record on disk (they use `created_by`/`updated_by`
 instead, populated by the console app, not Templater).

They also hardcode `owner: Joseph Childree` as a plain string, where the
blueprint's `owner` field is an `owner`-type picker (structured, not a
free-text default).

Since the console app (not Templater) is what's actually producing records
now (per `qa-brain/_dashboards/Home.md`'s banner), align the templates to
the blueprint schema so a manually-created-via-Templater record would carry
the same fields Dataview/the console actually expect:
- Remove `created`, `modified`, `source` frontmatter keys from all 7 templates.
- Replace the hardcoded `owner: Joseph Childree` line with `owner:` (blank --
 matches how every other unset field in these templates is left blank for
 the author to fill in).

Do **not** touch the body/section structure of the templates (Purpose,
Scope, Procedure tables, etc.) -- that's out of scope; only the frontmatter
block (the `---`-delimited header) changes.

Leave `qa-brain/Notes/` alone entirely -- Notes are explicitly exempt from
the status lifecycle/controlled vocabulary per `CLAUDE.md` and have no
template or dashboard of their own.

## Task 1 -- Fix `qa-brain/_dashboards/Home.md`

Apply every change listed under "Home.md" above using `Edit`. Read the file
first, then make each `docs/qa-brain/` → `qa-brain/`, `"Closed"` →
`"Obsolete"`, and `created` → `file.ctime` substitution. There are 6 `FROM`
lines, 3 `status != "Closed"` occurrences, 2 `SORT created DESC`
occurrences -- verify count after editing (see Verification).

## Task 2 -- Fix `qa-brain/_dashboards/CAP-Tracker.md`

Apply every change listed under "CAP-Tracker.md" above. 4 `FROM` lines, 1
`status != "Closed"`, 1 `related_records` → `related_documents`, 1 `SORT
created DESC` → `SORT file.ctime DESC`.

## Task 3 -- Fix `qa-brain/_dashboards/SOP-Control.md`

Apply every change listed under "SOP-Control.md" above. 5 `FROM` lines, the
`modified` column/sort → `file.mtime`, 1 `related_records` →
`related_documents` (both the `TABLE` column and the `WHERE` clause).

## Task 4 -- Fix `qa-brain/_dashboards/Audit-Prep.md`

Apply every change listed under "Audit-Prep.md" above, including adding the
missing `FROM` line to the "Recently Approved Documents" query (this is the
one query in the whole audit that was scanning the entire vault instead of
returning nothing/everything-within-scope -- call this out explicitly when
summarizing the fix).

## Task 5 -- Fix `qa-brain/_dashboards/Incident-Trends.md`

Apply every change listed under "Incident-Trends.md" above, including the
"Closed This Month" → "Obsoleted This Month" section rename and condition
fix.

## Task 6 -- Align template frontmatter in `qa-brain/_templates/*.md`

For each of `SOP.md`, `CAP.md`, `INCIDENT.md`, `CHANGE.md`, `AUDIT.md`,
`TRAINING.md`, `MEETING.md`:
- Delete the `created: <% tp.date.now("YYYY-MM-DD") %>` line.
- Delete the `modified: <% tp.date.now("YYYY-MM-DD") %>` line.
- Delete the `source: internal` line (not present in `SOP.md` -- skip it there).
- Change `owner: Joseph Childree` to `owner:`.

Leave every other frontmatter key and the entire body untouched.

## Verification

After all edits, from the repo root:

```bash
grep -rn "docs/qa-brain" qa-brain/_dashboards/ # expect: no matches
grep -rn '"Closed"' qa-brain/_dashboards/ # expect: no matches
grep -rn "related_records" qa-brain/_dashboards/ # expect: no matches
grep -rln "SORT created " qa-brain/_dashboards/ # expect: no matches
grep -rn "^created:\|^modified:\|^source:" qa-brain/_templates/ # expect: no matches
grep -rn "owner: Joseph Childree" qa-brain/_templates/ # expect: no matches
```

Also manually re-read each edited dashboard file in full afterward and
confirm every `dataview` fenced block still has balanced backticks and a
`FROM` clause scoped to `qa-brain/...` (or, for Audit-Prep's
"Documents Updated" query, the multi-folder `OR` chain) -- a stray edit that
breaks the code fence silently turns the whole block into inert markdown in
Obsidian.

Do not attempt to open Obsidian or run Dataview to confirm live query
results -- there is no test runner in this repo (per `CLAUDE.md`) and no
Obsidian automation available in this environment; the grep checks above plus
a careful re-read are the full verification for this task.

## Out of scope

- `qa-brain/_dashboards/EQMS-Project-Board.canvas` -- not a Dataview query file.
- `qa-brain/_meta/*.md` -- vault documentation, not queried by Dataview.
- The console app's blueprints (`app/frontend/src/blueprint/*.ts`) -- these
 are the source of truth being aligned *to*, not touched.
- `qa-brain/TRAINING/Zoho.md` -- pre-existing non-conforming record, not part
 of this audit's fix set.
- Populating the still-empty `CAP` and `SOP` folders with real records --
 out of scope; this task only fixes queries/templates so that whenever
 records do land there, the dashboards will actually surface them.
