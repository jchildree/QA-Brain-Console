# Backend Audit -- Stabilization Fixes for app/backend/src

**Wave:** 1 (parallel with vault-dashboard-audit, card-component-rendering-edge-cases, audit-relatedRecords-test-coverage)
**Consumes:** none
**Produces:** 400-validation guard on `PUT /api/records/:id`; OS-neutral `attachmentPath` join
**Owns exclusively:** app/backend/src/routes/records.js, app/backend/src/routes/attachments.js, test/records.route.test.js, test/attachments.route.test.js

## Goal

Audit `app/backend/src` (`routes/`, `providers/`, `middleware/`, `vault.js`,
`auth.js`, `config.js`) for stubs, TODOs, broken error handling, incomplete
routes, and frontend/backend response mismatches, and fix what's actually
broken. This is stabilization work -- no new endpoints, no schema changes.

## Context

Read every file under `app/backend/src` (19 files: `index.js`, `vault.js`,
`auth.js`, `config.js`, `fieldSchemas.js`, `users.js`, all of `routes/`,
`providers/`, `middleware/`), the full backend test suite (`app/backend/test`,
22 files / 137 tests -- all currently passing via `npm test`), and every
frontend call site that hits the backend (`app/frontend/src/api/client.ts`
plus every page/component importing from it, confirmed via
`grep -rn "/api/" app/frontend/src`).

**Finding: the backend is in good shape.** No `TODO`/`FIXME`/stub markers
exist anywhere in `app/backend/src` (`grep -rniE "TODO|FIXME|XXX|not
implemented|stub"` returns nothing). Every route the frontend calls exists
and matches the response shape `client.ts` expects (`/api/auth/*`,
`/api/admin/users*`, `/api/users/active`, `/api/{sops,cap,incident,change,
audit,training,notes}` CRUD, `/api/*/​:filename/attachments`, `/api/evidence`,
`/api/evidence/unlinked`, `/api/trash*`, `/api/search`,
`/api/parse-frontmatter`, `/api/intake/extract`). The `ponytail:` comments in
`vault.js` (hash-based optimistic concurrency instead of file locks) and
`middleware/loginRateLimit.js` (in-memory rate-limit map) are deliberate,
already-labeled tradeoffs with documented upgrade paths -- not defects, leave
them alone.

Two real, verified defects survived the audit, both narrow and independently
fixable:

### Defect 1 -- `PUT /api/:type/:filename` returns 500 instead of 400 on a malformed body

`app/backend/src/routes/records.js` lines 28-43. The handler destructures
`const { frontmatter, body, expectedHash } = req.body;` with no validation,
then calls `writeSop(dir, filename, stamped, body, expectedHash)`, which
calls `matter.stringify(body, frontmatter)` unconditionally. `gray-matter`
throws `Error: expected file to be a string or object` when `body` is
`undefined` (e.g. `PUT` with `{}` or a body missing the `body`/`frontmatter`
keys). That thrown error is not a `ConflictError`, so the route's catch block
rethrows it, it reaches `index.js`'s final error middleware, and the client
gets a bare `500 { error: 'internal server error' }` instead of a `400` that
says what's wrong.

Verified directly:
```js
// app/backend, node -e repro (see plan verification below)
// PUT /api/cap/CAP-20260101-001.md with body {} -> 500, not 400
```

Compare with `POST /api/:type` (same file, lines 45-50), which already
guards against exactly this: `createRecord(dir, idPrefix, stamped || {},
body || '')`. The `PUT` handler is missing the equivalent guard. This is the
kind of malformed-request case a client bug, a stale frontend build, or a
manual `curl` mistake can trivially trigger, and it currently surfaces as an
unhelpful 500 with a stack trace logged server-side instead of a normal
validation error.

### Defect 2 -- `attachmentPath` in the attachment-upload response uses OS-native path separators

`app/backend/src/routes/attachments.js` line 45:
```js
const attachmentPath = path.join('attachments', recordBase, safeName);
```
`path.join` uses the host OS separator. This backend runs on Windows in this
environment (confirmed: `Platform: win32` in the environment info, and this
is a Windows machine per `OS Version: Windows 11 Pro`), so `attachmentPath`
comes back as `attachments\NOTE-1\report.pdf`, not
`attachments/NOTE-1/report.pdf`. `app/frontend/src/api/client.test.ts` (lines
137-147) asserts the forward-slash form, and this vault's whole reason for
existing is Obsidian-compatible markdown (wikilinks, relative paths) --
Obsidian and Markdown links always expect `/`. `app/frontend/src/pages/
NoteEditor.tsx`'s `SourcesPanel` does not currently persist or render
`attachmentPath` (it just re-fetches `/api/evidence` after upload), so this
does not visibly break the running app today, but it is a live field in the
documented API response (`uploadAttachment`'s return type in `client.ts`)
that any future consumer -- or a script writing this path into a record body
as a source link -- would get wrong on this OS. Fix it at the source rather
than waiting for a caller to inherit the bug: build the path with a literal
`/` join (or `path.posix.join`), matching how `evidence.js`'s
`recordFilename`/`attachmentFilename` fields are already OS-neutral (plain
filenames, no joining).

### Non-issues considered and ruled out

- **Attachment/evidence filename collisions** (`attachments.js` line 29-30,
  `evidence.js` line 67-68): a second upload with the same original filename
  silently overwrites the first via `fs.writeFileSync`. This *could* lose
  evidence, but it mirrors normal filesystem/Obsidian behavior for
  drag-and-drop file replacement, no frontend flow currently surfaces
  filename choice or collision warnings either way, and "auto-rename on
  collision" is new behavior, not a stabilization fix -- skip it. Flagging
  here for a future ADR if evidence-integrity requirements tighten.
- **`attachments.js` mimetype sniffing** (`req.file.mimetype.startsWith('text/')`
  gates AI extraction): browsers/OSes don't always set `text/markdown` for
  `.md` uploads, so some text evidence silently skips extraction and falls
  into the binary "no automatic extraction" branch. This is a heuristic
  quality issue, not broken error handling -- no crash, no wrong response
  shape, the `note` field correctly reports what happened. Out of scope.
- Every other route (`admin.js`, `auth.js`, `search.js`, `trash.js`,
  `users.js`, `intake.js`, `parse.js`, `evidence.js` GET/POST,
  `requireAuth.js`, `requireAdmin.js`, `loginRateLimit.js`, all three
  providers, `users.js`, `vault.js`, `config.js`) were read in full and have
  no stubs, no missing routes, and consistent try/catch → typed status code
  behavior, confirmed by the existing 137 passing tests plus manual
  reasoning above. Nothing else to fix.

## Tasks

1. **Fix Defect 1 -- guard `PUT /api/:type/:filename` against a malformed body.**
   - File: `app/backend/src/routes/records.js`, inside the
     `router.put(`/${urlSlug}/:filename`, ...)` handler (currently lines
     28-43).
   - Add a validation check immediately after destructuring
     `req.body`, before calling `writeSop`:
     ```js
     const { frontmatter, body, expectedHash } = req.body || {};
     if (typeof body !== 'string' || frontmatter === null || typeof frontmatter !== 'object') {
       return res.status(400).json({ error: 'frontmatter (object) and body (string) are required' });
     }
     ```
   - Keep the rest of the handler (the `stamped` computation, the
     `writeSop` call, the `ConflictError` catch) unchanged -- this is a
     guard clause inserted before the existing logic, not a rewrite.
   - Do **not** add the same guard to `POST /api/:type` -- it already
     defaults safely (`stamped || {}`, `body || ''`) and creating a record
     with an empty body is legitimate (blank new record).

2. **Fix Defect 2 -- make `attachmentPath` OS-neutral.**
   - File: `app/backend/src/routes/attachments.js`, line 45.
   - Change:
     ```js
     const attachmentPath = path.join('attachments', recordBase, safeName);
     ```
     to:
     ```js
     const attachmentPath = ['attachments', recordBase, safeName].join('/');
     ```
   - Leave every other use of `path.join`/`path.basename` in this file
     alone -- those build real filesystem paths for `fs` calls, where the
     native separator is correct. Only the *returned* `attachmentPath`
     string needs to be slash-normalized, because it's a vault-relative
     reference, not a filesystem call argument.

3. **Add regression tests for both fixes.**
   - File: `app/backend/test/records.route.test.js`, inside the existing
     `describe('PUT /api/cap/:filename', ...)` block. Add one test:
     ```js
     it('returns 400 for a malformed body instead of crashing', async () => {
       const res = await request(app).put('/api/cap/CAP-20260101-001.md').send({});
       expect(res.status).toBe(400);
     });
     ```
     Follow the existing fixture/`beforeEach` setup already in this file --
     no new setup needed, it reuses `tmpDir`/`app` from the top-level
     `beforeEach`.
   - File: `app/backend/test/attachments.route.test.js`, inside the existing
     `describe('POST /api/cap/:filename/attachments', ...)` block. Add one
     test asserting the exact forward-slash string (this is what currently
     silently passes on Windows because the existing tests only check
     `fs.existsSync`, never the response `attachmentPath` value):
     ```js
     it('returns attachmentPath with forward slashes regardless of host OS', async () => {
       const fakeProvider = makeFakeProvider({});
       app = express();
       app.use('/api', createAttachmentsRouter('cap', tmpDir, fakeProvider));

       const res = await request(app)
         .post('/api/cap/CAP-20260101-001.md/attachments')
         .attach('evidence', Buffer.from('text'), { filename: 'note.txt', contentType: 'text/plain' });

       expect(res.body.attachmentPath).toBe('attachments/CAP-20260101-001/note.txt');
     });
     ```

## Verification

1. `cd app/backend && npm test` -- all existing 137 tests plus the 2 new
   ones must pass (139 total). This is the primary verification: it runs on
   this Windows host, so the new `attachmentPath` test only passes once
   Defect 2 is actually fixed here (it would fail today, pre-fix, proving
   the bug is real and not just a code-reading conclusion).
2. Manual repro check for Defect 1 (optional, the test already covers it):
   ```
   cd app/backend
   node -e "
   const express = require('express');
   const request = require('supertest');
   const fs = require('fs'); const os = require('os'); const path = require('path');
   const { createRecordsRouter } = require('./src/routes/records');
   const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-vault-'));
   fs.writeFileSync(path.join(tmpDir, 'CAP-20260101-001.md'), '---\nid: CAP-20260101-001\n---\nbody\n');
   const app = express();
   app.use(express.json());
   app.use('/api', createRecordsRouter('cap', 'CAP', tmpDir, path.join(tmpDir,'trash')));
   request(app).put('/api/cap/CAP-20260101-001.md').send({}).then(res => console.log(res.status, res.body));
   "
   ```
   Expect `400 { error: '...' }`, not `500`.
3. `git diff app/backend/src app/backend/test` -- confirm the diff is
   exactly the two guard/join changes plus the two new tests, nothing else
   touched (this is a stabilization pass, not a refactor).
4. Do not run or modify anything under `qa-brain/` or the frontend as part
   of this plan -- scope is `app/backend/src` and its tests only.
