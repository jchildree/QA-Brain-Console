# Scoped Chat-Assisted Draft Record Creation

**Wave:** 9 (after backend-chat-endpoint-provider-methods, Wave 8, commits)
**Consumes:** `POST /api/chat` route (Wave 8, backend-chat-endpoint-provider-methods)
**Produces:** `validateChatScope` middleware (allowedTypes allowlist); ChatScopePicker UI
**Owns exclusively:** app/backend/src/middleware/validateChatScope.js, app/backend/src/index.js (middleware mount), app/frontend/src/components/ChatScopePicker.tsx, app/frontend/src/api/client.ts (createRecordApi), App.tsx (admin settings entry)

> **For agentic workers:** Execute task-by-task using checkboxes. Use `subagent-driven-development` skill or manual execution.

**Goal:** Allow Claude's draft-record proposal feature (the existing `POST /api/{recordType}` intake flow with AI field extraction via `/intake/extract`) to be scoped per-session to only certain record types. Users configure which record types allow chat-assisted creation; the backend validates and rejects creates outside the allowed scope, preventing unintended record proliferation.

**Context:** The QA-Brain console already has a robust record-creation flow:
- Frontend: `RecordIntake.tsx` collects raw text, calls `/api/intake/extract` to let Claude propose frontmatter fields, user reviews/edits, saves via `api.create(frontmatter, body)` → `POST /api/{recordType}`.
- Backend: `createRecord()` in `vault.js` auto-generates record IDs, always sets `status: Draft`, and stamps `created_by` with the authenticated user.
- Auth: Existing `requireAuth` middleware already vets the user per session.

**Scope:** This plan adds:
1. A **scope-picker UI** (admin or per-user setting) to choose which record types allow chat-assisted creates.
2. **Backend validation** on `POST /api/{recordType}` to check that the type is in the user's allowed scope if a scope is active.
3. **No new database table** – scope is a per-request allowlist, optionally stored in the existing user record in `users.json` as a new `chat_enabled_types` field, or cached client-side in localStorage.

**Non-goals:** User role changes, permission grant tables, audit logging of scope changes, UI for non-admin users to manage other users' scopes (admin only).

---

## Technical Design

### Backend: Scope Validation Middleware

Add optional per-request validation **before** `createRecord()` executes. The scope check:
- Reads `req.body.allowedTypes` (array of slug strings like `['sop', 'cap', 'incident']`) if provided by the client.
- Compares against the record type being created (`urlSlug` extracted from the route, e.g. `/api/sops` → `sop`).
- Returns `403 Forbidden` with `{ error: 'record type not in allowed scope for chat-assisted creation' }` if the type is NOT in the allowlist.
- Allows the create if allowedTypes is not provided (backward-compatible; defaults to unrestricted) or if the type IS in the list.

**Implementation approach:**
- Create a new middleware `app/backend/src/middleware/validateChatScope.js` that wraps the scope check.
- Wire it **after** `requireAuth` and **before** the `createRecordsRouter` POST handler in `app/backend/src/index.js`.
- No changes to `createRecord()` itself – validation happens in middleware, not in the vault layer.

### Frontend: Scope UI

Add a **settings panel** (admin-only initially, or in user preferences if we extend role-based settings later) where users toggle which record types allow chat-assisted creation:
- Checkboxes for each of the 8 record types (SOP, CAP, Incident, Change, Audit, Training, Meeting, Notes).
- Stored in one of two places:
  - **Option A (simpler):** Browser `localStorage` under a key like `qa_brain_chat_scope` – survives page reloads, per-device only, no backend sync.
  - **Option B (persistent across devices):** New field `chat_enabled_types` in users.json; requires a PATCH to `/api/admin/users/{username}` to update, then fetch on session start.
- Recommend **Option A** for the first pass (simpler, no backend DB change) with a note in the code that it can graduate to Option B later.

### Wiring: Pass Scope to Create Requests

The `api.create()` function in `app/frontend/src/api/client.ts` (line 177) currently sends `{ frontmatter, body }`. Update it to:
1. Read the allowedTypes from localStorage (or fetch from the server user object if using Option B).
2. Append `allowedTypes` to the request body: `{ frontmatter, body, allowedTypes }`.
3. Backend middleware reads `req.body.allowedTypes` and validates.

**Records created outside chat scope** (e.g., via the record editor directly, not RecordIntake) bypass the scope check – they use the same `api.create()` call but without the `allowedTypes` field, so validation is skipped (permissive fallback). This preserves manual record creation for admins.

---

## Implementation Tasks

### Task 1: Backend – Chat Scope Validation Middleware

- [ ] Create `app/backend/src/middleware/validateChatScope.js`:
  - Exports a function `validateChatScope(req, res, next)` that:
    - Extracts `allowedTypes` from `req.body` (if present).
    - If no `allowedTypes`, calls `next()` immediately (no scope restriction).
    - If `allowedTypes` is present:
      - Extract the record type slug from `req.baseUrl` (e.g., `/api/sops` → `sop`, `/api/cap` → `cap`). Use the mapping from `RECORD_TYPES` in config.js.
      - Check if slug is in `allowedTypes`.
      - If not, respond `403` with error message.
      - If yes, call `next()`.
  - Import and test the slug-extraction logic (e.g., test that `/api/sops` maps to `sop`, not `SOP`).

- [ ] Wire middleware into `app/backend/src/index.js`:
  - After line 57 (`const requireAuth = ...`), add: `const validateChatScope = createValidateChatScope();`
  - After line 72 (the `for...of RECORD_TYPES` loop), wrap the POST handler:
    ```javascript
    app.use(`/api/${urlSlug}`, requireAuth, validateChatScope);
    ```
  - No changes to POST handler itself in `routes/records.js`.

- [ ] Unit test (minimal):
  - Test that a POST with `allowedTypes: ['sop', 'cap']` to `/api/sops` succeeds.
  - Test that a POST with `allowedTypes: ['sop']` to `/api/cap` returns 403.
  - Test that a POST with no `allowedTypes` field succeeds (backward-compat).

### Task 2: Frontend – Chat Scope Picker UI

- [ ] Create `app/frontend/src/components/ChatScopePicker.tsx`:
  - Props: `{ onChange: (allowedTypes: string[]) => void }`.
  - Renders checkboxes for each of `Object.keys(RECORD_TYPES)` (imports from `app/frontend/src/api/client.ts` or a shared types file).
  - Controlled component: `value` is passed in, `onChange` fires when any checkbox is toggled.
  - Styling: match existing form/checkbox patterns in `DynamicForm.tsx` or `RecordIntake.tsx`.

- [ ] Add scope picker to **admin user settings** (or create a new "Chat Scope" settings page):
  - If using existing admin panel (`app/frontend/src/pages/AdminUsers.tsx` or similar – check what exists), add a collapsible section.
  - Label: "Chat-Assisted Record Types" or "Enable Claude Proposals For:".
  - Default: all 8 types checked (permissive, no breaking change).
  - On toggle, save to localStorage under key `qa_brain_chat_scope` as a JSON array of slugs.

- [ ] Fetch scope on app init (App.tsx or a context provider):
  - On mount, read `localStorage.getItem('qa_brain_chat_scope')`.
  - If not set, default to all types enabled (see `RECORD_TYPES` keys).
  - Store in a React context or a global state (e.g., a ref in a custom hook) so RecordIntake and other components can access it.
  - **Note:** If you later switch to Option B (persisted in users.json), fetch from `/api/users/me` (or extend the session check response) instead of localStorage; update this task's note.

### Task 3: Frontend – Wire Scope to Record Create Calls

- [ ] Update `app/frontend/src/api/client.ts`, function `createRecordApi()` (lines 152–202):
  - Modify the `async create(frontmatter, body)` handler (line 177) to:
    - Read the current scope from the context/state created in Task 2 (import the hook if using one).
    - Append `allowedTypes` to the request body: `{ frontmatter, body, allowedTypes }`.
    - Send the request (no other changes).

- [ ] Test in `app/frontend/src/api/client.test.ts`:
  - Mock the scope context to return `['sop', 'cap']`.
  - Call `api.create()` for a CAP record → verify the request body includes `allowedTypes: ['sop', 'cap']`.
  - Mock the scope to exclude the type being created → verify the test still sends the request (backend will reject it; frontend just passes scope along).

### Task 4: Frontend – Preserve Backward Compatibility

- [ ] Test that record creation via **non-chat paths** (e.g., manual RecordEditor, not RecordIntake) still works:
  - These calls do NOT set `allowedTypes`, so middleware skips validation (permissive).
  - Verify no regression in existing test suites (`npm run test` in app/frontend).

### Task 5: Integration & Manual Verification

- [ ] Start both servers:
  - Backend: `cd app/backend && npm run start` (port 4000).
  - Frontend: `cd app/frontend && npm run dev -- --port 5173`.

- [ ] Test workflow:
  - Log in as a user.
  - Navigate to admin settings (or Chat Scope page).
  - Uncheck "SOP" in the chat scope picker; check "CAP" and "Incident" only. Save.
  - Open the CAP Intake page, paste raw text, extract and save → record creates successfully.
  - Open the SOP Intake page, paste raw text, extract and save → should see a 403 error or "not allowed" message.
  - Open the CAP Editor (not Intake), create a record manually → should succeed (no scope check).

- [ ] Verify localStorage persistence:
  - Open DevTools → Application → Local Storage → check `qa_brain_chat_scope` contains the correct array.
  - Reload the page; scope picker should reflect the saved state.

- [ ] Run test suite:
  - `cd app/backend && npm run test` – no regressions in existing auth/route tests.
  - `cd app/frontend && npm run test` – no regressions in existing create/intake tests.

### Task 6: Error Messaging & UX

- [ ] Backend response (already in Task 1):
  - `{ error: 'record type not in allowed scope for chat-assisted creation' }` on 403.

- [ ] Frontend: Show user-facing error if a create fails with 403:
  - Update `RecordIntake.tsx` or the `api.create()` caller to catch and display: "This record type is not enabled for chat-assisted creation. Ask an admin to enable it, or create it manually via the record editor."
  - Optionally add a button "Create manually" that navigates to the SOP/CAP/etc. editor instead.

---

## Files Touched

**Backend:**
- `app/backend/src/middleware/validateChatScope.js` (new)
- `app/backend/src/index.js` (add middleware import & wiring)
- `app/backend/src/middleware/validateChatScope.test.js` (new, minimal unit test)

**Frontend:**
- `app/frontend/src/components/ChatScopePicker.tsx` (new)
- `app/frontend/src/api/client.ts` (modify `createRecordApi()`)
- `app/frontend/src/api/client.test.ts` (add test cases)
- `app/frontend/src/App.tsx` or a new context/hook file (initialize scope from localStorage)
- Admin settings page (add ChatScopePicker if it doesn't exist; check structure first)

**Test:**
- Extend existing tests in `app/backend/test/routes/records.test.js` (if exists) or create one.
- Extend `app/frontend/src/api/client.test.ts`.

---

## Validation Checklist

- [ ] Middleware returns 403 when create type is outside allowed scope.
- [ ] Middleware allows create when type is inside allowed scope.
- [ ] Middleware allows any type when `allowedTypes` is not provided (backward-compat).
- [ ] Scope picker UI is accessible (checkboxes, labels, keyboard navigation).
- [ ] Scope is persisted across page reloads (localStorage survives reload).
- [ ] CAP Intake with SOP-only scope enabled returns an error.
- [ ] Manual record editor (non-intake) bypasses scope check and creates successfully.
- [ ] User sees a clear error message if scope blocks creation.
- [ ] No test regressions in backend or frontend test suites.

---

## Future Extensions

1. **Persistent scope (Option B):** Add `chat_enabled_types` field to users.json, expose via PATCH `/api/admin/users/{username}`, fetch on session init.
2. **Per-user scope:** If implementing Option B, let each user configure their own scope (not just admins).
3. **Audit logging:** Log scope enforcement decisions in a new audit table (out of scope for this pass).
4. **UI improvement:** Add a scope-override button for admins during intake (e.g., "Override scope and create anyway").
5. **Default scope templates:** Admins define a default scope template (e.g., "QA team gets SOP+Incident, QC team gets Audit+Training") applied to new users.
