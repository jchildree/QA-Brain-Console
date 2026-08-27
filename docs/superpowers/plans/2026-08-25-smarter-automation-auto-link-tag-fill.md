# Smarter automation: auto-link, auto-tag, auto-fill (suggest-only, human-gated)

**Wave:** 8 (parallel with backend-chat-endpoint-provider-methods; disjoint files)
**Consumes:** app/frontend/src/api/relatedRecords.ts mergeRelated (extends it)
**Produces:** parseInlineIds/suggestTags auto-fill; `renderExtra(fm, body, autoFill)` signature change (affects all RecordEditor.tsx consumers -- CapEditor, AuditEditor, etc. import RecordEditor, not renderExtra directly, so no fan-out edit needed)
**Owns exclusively:** app/frontend/src/api/relatedRecords.ts (parseInlineIds/fetchTagVocabulary/suggestTags/mergeTags), app/frontend/src/components/RecordIntake.tsx, RecordEditor.tsx, NoteEditor.tsx

## Goal

Extend the existing AI intake/extract-and-attach pipeline with three low-risk
auto-actions, all of which populate in-browser form state for a human to
review and explicitly Save -- none of them write to disk on their own and
none of them ever touch `status` or approval fields:

1. **Auto-link related records** -- detect `[[wikilink]]`-style and bare
   document-id references anywhere in a record's body (not just under a
   `## Related` heading, which is all today's code catches) and fold them
   into `related_documents`.
2. **Auto-tag** -- suggest tags already used elsewhere in the vault when
   their words appear in a record's title/body, merged additively into the
   `tags` field.
3. **Auto-fill obvious frontmatter fields from attached evidence** -- wire
   up the AI extraction that `POST /:urlSlug/:filename/attachments` already
   runs on text attachments (`app/backend/src/routes/attachments.js`) but
   whose `extracted` result the frontend currently receives and silently
   discards. Use it to fill only frontmatter fields that are still empty.

## Context (what's already there -- read before writing code)

This vault app already has most of the machinery this task needs; the job
is extending it, not building it from scratch.

- **AI extraction** (`app/backend/src/providers/*.js`,
  `app/backend/src/fieldSchemas.js`) turns raw text into a JSON object of
  frontmatter fields (`title`, `status`, `version`, `related_documents`,
  plus per-type fields like `tags`, `department`). It's invoked from two
  places:
  - `POST /intake/extract` (`app/backend/src/routes/intake.js`) -- used by
    `RecordIntake.tsx` when creating a new record. The result already lands
    in editable form fields (`fields` state) that the user reviews before
    clicking Save -- this is the existing "suggest, human confirms" pattern
    to match.
  - `POST /:urlSlug/:filename/attachments`
    (`app/backend/src/routes/attachments.js`, lines 32-43) -- runs the same
    `provider.extractFields()` against any text-type attachment and returns
    `{ attachmentPath, extracted, note }`. **`extracted` is currently thrown
    away.** The only caller is `SourcesPanel` inside
    `app/frontend/src/pages/NoteEditor.tsx` (lines 23-86), whose
    `handleUpload` calls `uploadAttachment(...)` and just reloads the
    source list -- it never looks at `extracted`. This is the concrete gap
    for auto-action #3.
- **Body-to-related_documents folding already exists, but only for one
  syntax.** `app/frontend/src/api/relatedRecords.ts` has:
  - `parseRelatedSection(text)` -- walks the body and only collects lines
    under a heading matching `/^related\b/i`, stripping list markers and
    `[[...]]` braces.
  - `mergeRelated(existing, parsed)` -- dedupes `parsed` ids into the
    existing `related_documents` array, additive only (never removes ids).
  - Both `RecordIntake.tsx` (`handleExtract`, `handleSave`) and
    `RecordEditor.tsx` (`handleSave`) already call
    `mergeRelated(fields/frontmatter.related_documents, parseRelatedSection(body))`
    on save. A `[[wikilink]]` anywhere else in the body (not under
    `## Related`) is currently invisible to this -- that's the gap for
    auto-action #1.
  - The document ID convention is `{TYPE}-{YYYYMMDD}-{seq}`, e.g.
    `SOP-20260528-001`, `INC-20260528-001`, `CAP-20260528-001`,
    `CHG-20260528-001`, `AUD-20260528-001`, `TRN-20260528-001`,
    `MTG-20260528-001`, `NOTE-20260528-001` (see root `CLAUDE.md`). Build
    the inline-scan regex from this pattern:
    `/\b(SOP|CAP|INC|CHG|AUD|TRN|MTG|NOTE)-\d{8}-\d{3}\b/g`, applied
    whether or not the match is wrapped in `[[...]]`.
- **No tag vocabulary aggregator exists yet.**
  `app/frontend/src/api/relatedRecords.ts` already has
  `fetchAllRecordOptions()`, which calls
  `createRecordApi(urlSlug).list()` for every type in `TYPES` and flattens
  the results -- this is the pattern to reuse for auto-tag, since `.list()`
  responses already include each record's frontmatter (confirm via
  `GET /:urlSlug` -> `listSops(dir)` in `app/backend/src/vault.js`, which
  reads every record's frontmatter off disk). No backend change needed for
  auto-tag; it can be built as a frontend-only aggregation, mirroring
  `fetchAllRecordOptions`'s cached-promise shape.
- **Controlled vocabulary**: `tags` is the one free-form array field (no
  fixed vocabulary) per `app/backend/src/fieldSchemas.js` and root
  `CLAUDE.md`. `department` (`QC, QA, IT, Operations`) and `status`
  (`Draft, In Review, Approved, Obsolete`) are fixed-vocabulary -- status is
  explicitly off-limits per this task's constraints, so auto-fill must
  never write to `frontmatter.status` under any code path.
- **Form field types**: `app/frontend/src/blueprint/*.ts` define each
  record type's field list (`type: 'tags'` and `type: 'related'` fields
  render as chip/array editors via `DynamicForm.tsx` -- read
  `app/frontend/src/components/DynamicForm.tsx` briefly to see how a
  `tags`/`related` field's array value is rendered and edited, so the
  auto-filled arrays are shaped the same way the manual editor produces
  (array of trimmed strings, no duplicates).
- **Tests to follow as style reference**:
  `app/frontend/src/api/relatedRecords.test.ts` (unit tests for
  `parseRelatedSection`/`mergeRelated` -- extend in place),
  `app/frontend/src/components/RecordIntake.test.tsx`,
  `app/frontend/src/pages/NoteIntake.test.tsx`. Backend route tests, if any
  exist for `attachments.js`, are under `app/backend/src/routes/*.test.js`
  -- check with `Glob` before assuming none exist.
- **Constraint recap (must hold across every change in this plan)**:
  - Never write to `frontmatter.status` or `approved_by` in any auto-fill
    path -- only additive/empty-field fills to `tags`, `related_documents`,
    and other non-lifecycle fields.
  - Every auto-action populates React state that still requires the
    existing human "Save" button click (`RecordEditor.handleSave`,
    `RecordIntake.handleSave`) to persist -- do not add any new
    direct-to-API write path.
  - Additive merges only: never remove or overwrite a value the user (or a
    prior extraction) already put in a field. For `tags`/`related_documents`
    this means dedupe-and-append, matching `mergeRelated`'s existing
    behavior. For scalar fields (auto-fill from attachment extraction),
    only set a field if its current value is empty/undefined.

## Tasks

### 1. Extend related-document detection to scan the whole body, not just a `## Related` section

File: `app/frontend/src/api/relatedRecords.ts`

- Add a new exported function `parseInlineIds(text: string): string[]` that
  matches `/\b(SOP|CAP|INC|CHG|AUD|TRN|MTG|NOTE)-\d{8}-\d{3}\b/g` against
  the raw text (the whole body, including inside `[[...]]` -- the brackets
  don't interfere with the regex since it only needs the bare id
  substring) and returns the deduped list of matches, preserving
  `Array.from(new Set(...))` order.
- Keep `parseRelatedSection` untouched (still needed to distinguish an
  explicit "these are related" section from incidental mentions elsewhere,
  and its behavior is depended on by existing tests) -- `parseInlineIds` is
  additive, a superset scan.
- Update `mergeRelated` callers in `RecordIntake.tsx` (`handleExtract` and
  `handleSave`) and `RecordEditor.tsx` (`handleSave`) to merge both:
  `mergeRelated(mergeRelated(existing, parseRelatedSection(body)), parseInlineIds(body))`
  -- or flatten into one array passed to `mergeRelated` (either is fine,
  keep it to the existing `mergeRelated(existing, parsed: string[])`
  signature, don't widen its signature just to accept two arrays).
- Do not auto-link an id that is the record's own `id` (self-reference) --
  filter it out before merging, using `frontmatter.id` / `fields.id` if
  present.

### 2. Add a tag-vocabulary aggregator and auto-tag on save

File: `app/frontend/src/api/relatedRecords.ts` (or a new sibling file
`app/frontend/src/api/tagVocabulary.ts` if keeping `relatedRecords.ts`
focused feels cleaner -- either is fine, don't create a module for a single
20-line function if it fits naturally alongside `fetchAllRecordOptions`).

- Add `fetchTagVocabulary(): Promise<string[]>` that reuses the same
  `TYPES`/`createRecordApi(urlSlug).list()` loop as `fetchAllRecordOptions`
  (factor the shared "list every record of every type" loop into one
  helper if that's a clean small diff; otherwise duplicate the loop rather
  than over-abstracting for two callers), collecting every string in each
  record's `tags` array frontmatter field, deduped, cached the same way
  (`cachedPromise` pattern) with its own `resetTagVocabularyCache()`
  export.
- Add `suggestTags(text: string, vocabulary: string[]): string[]` -- for
  each vocabulary tag, word-boundary-match it against `text`
  case-insensitively (`new RegExp('\\b' + escapeRegExp(tag) + '\\b', 'i')`);
  return the matching subset. Escape regex special characters in the tag
  before building the pattern (tags are free text, could contain
  characters like `+`).
- Wire into `RecordIntake.tsx`: on `handleSave`, merge
  `suggestTags(fields.title + ' ' + body, await fetchTagVocabulary())`
  into `fields.tags` the same additive way `related_documents` is merged
  (dedupe, append -- write a small local `mergeTags(existing, suggested)`
  helper next to `mergeRelated` in `relatedRecords.ts`, or reuse
  `mergeRelated`'s generic shape if you generalize it to a
  `mergeUnique(existing, additions)` name -- prefer renaming/generalizing
  over adding a near-duplicate function, since the merge logic (filter to
  strings, append if not already present) is identical for tags and
  related_documents).
- Wire the same call into `RecordEditor.tsx`'s `handleSave`.
- Because `fetchTagVocabulary()` is now async and used inside
  `handleSave`, confirm both `handleSave` functions are already `async`
  (they are) and just `await` it before building `merged`.

### 3. Surface attachment extraction results and auto-fill empty frontmatter fields

Files: `app/frontend/src/pages/NoteEditor.tsx`,
`app/frontend/src/components/RecordEditor.tsx`.

- `RecordEditor` needs a way for `renderExtra`/a child like `SourcesPanel`
  to push auto-filled frontmatter values back up. Add an optional prop
  `onAutoFill?: (fields: Record<string, unknown>) => void` to
  `RecordEditor` that a `renderExtra` child can call; internally,
  `RecordEditor` implements it as a function merging into `frontmatter`
  state field-by-field, **only when the existing value is
  empty/undefined/empty-string/empty-array**, and **always dropping
  `status` and `approved_by` keys from the incoming object before
  merging** (defense in depth -- extraction shouldn't produce these from an
  attachment source, but the merge must not trust that). Pass this merge
  function down via `renderExtra`'s existing call signature -- since
  `renderExtra` currently only receives `(frontmatter, body)`, extend its
  signature to `(frontmatter, body, autoFill)` (check all other
  `renderExtra` usages beyond `NoteEditor` with
  `Grep -rn "renderExtra"` before changing the signature, to update every
  caller).
- In `NoteEditor.tsx`'s `SourcesPanel.handleUpload`, capture
  `{ extracted }` from `uploadAttachment(...)` and, when non-null, call the
  new `autoFill(extracted)` callback (passed down as a new `SourcesPanel`
  prop) instead of discarding it. Show a small inline note in the panel
  like "Filled N empty field(s) from this source -- review before saving"
  (reuse the existing muted-text style already used for `error`/empty-state
  text in that component) so the auto-fill isn't silent -- this satisfies
  the "suggest, human confirms" default since nothing is written to disk
  until the existing Save button in `RecordEditor` is clicked.
- Do not change what happens for binary attachments (`note` = "Binary
  evidence attached...") -- only wire the `extracted` (text-attachment)
  path.

### 4. Tests

- `app/frontend/src/api/relatedRecords.test.ts`: add cases for
  `parseInlineIds` -- bare id, `[[wrapped]]` id, multiple ids, an id that's
  also inside a `## Related` section (dedup), no match on near-miss
  strings (wrong segment lengths/prefixes) -- and for `suggestTags`/tag
  vocabulary merge helper -- case-insensitive match, word-boundary (no
  partial-word match), regex-special-character tag names, empty
  vocabulary.
- `app/frontend/src/components/RecordIntake.test.tsx` and/or
  `app/frontend/src/pages/NoteIntake.test.tsx`: extend or add a case
  confirming `handleSave` merges inline body ids and vocabulary tag
  matches into the saved payload without needing the AI Extract button to
  be clicked.
- A `RecordEditor`-focused test (check `Glob` for an existing
  `RecordEditor.test.tsx`; if none exists, don't create a full new suite
  file just for this -- add the auto-fill assertion to whichever existing
  test already renders `RecordEditor` end-to-end, e.g. via `NoteEditor`)
  -- assert that uploading a text attachment with extracted
  `status: 'Approved'` in its response never ends up in the saved
  frontmatter, and that an extracted field only lands when the
  corresponding form field started empty.

## Verification

1. `cd app/frontend && npm run test` -- all existing and new tests pass,
   specifically `relatedRecords.test.ts`, `RecordIntake.test.tsx`,
   `NoteIntake.test.tsx`, and whichever `RecordEditor`/`NoteEditor` test
   gained the auto-fill assertion.
2. `cd app/frontend && npm run build` -- `tsc -b` passes with the widened
   `renderExtra` signature and any new exported types.
3. `cd app/frontend && npm run lint` -- oxlint clean.
4. `cd app/backend && npm run test` -- unaffected, but run to confirm no
   accidental backend edits broke anything (this plan is frontend-only; if
   a backend change turns out to be needed, treat that as a signal the
   plan scope was misjudged and stop to reassess rather than improvising a
   larger backend change).
5. Manual smoke check against the running app (optional but recommended):
   create a Note whose body contains a bare `INC-20260731-001`-style id
   outside any `## Related` heading and a word matching an existing tag in
   the vault; confirm both appear in the form fields after Save is clicked
   (not before) without a page reload showing them written to disk
   prematurely. Attach a small `.txt` "source" to an existing record with
   an empty `department` field and confirm the SourcesPanel shows the
   "filled N field(s)" note and the Department field populates, while
   `status` stays untouched regardless of what's in the attachment's
   extracted JSON.

## Explicitly out of scope (don't build these)

- Any change to how `status`/`approved_by` flow through extraction or
  auto-fill -- those remain 100% manual, always.
- A backend `/tags` aggregation endpoint -- the frontend-only
  `fetchTagVocabulary()` reusing `.list()` is sufficient at this vault's
  scale (a handful of records per type); revisit only if list-fetch
  latency becomes a real problem.
- Fuzzy/semantic tag or related-record suggestion (embeddings, similarity
  scoring) -- word-boundary substring matching on an explicit vocabulary is
  the whole ask ("low-risk auto-actions"), not a recommendation engine.
- Any change to `RelatedRecordsGraph.tsx`'s rendering -- it already reads
  `related_documents`, so once auto-link populates that field the graph
  picks it up with zero changes.
