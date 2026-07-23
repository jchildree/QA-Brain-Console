# Record-Type Generalization + CAP Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close two gaps left by the SOP vertical slice (`docs/superpowers/plans/2026-07-15-sop-vertical-slice.md`) and the auth/provider work (`2026-07-16-auth-and-provider-abstraction.md`):

1. **No create-new-record endpoint exists anywhere.** `routes/sops.js` only has `GET /sops`, `GET /sops/:filename`, `PUT /sops/:filename` -- even the SOP Intake flow (`Intake.tsx`) extracts fields via Claude but never persists a new file. Fix this once, generically, for all 6 record types.
2. **CAP, Incident, Change, Audit, Training are 11-line placeholder pages** (`CapPage.tsx` etc.) with zero backend routes. Bring CAP fully online as the reference implementation of a generic pattern the other 4 types can reuse without rewriting.

**Architecture:** Backend gets a generic `RECORD_TYPES` registry (`app/backend/src/config.js`) mapping a URL slug (`cap`, `sop`, …) to a vault directory and an ID prefix (`CAP`, `SOP`, …). One router factory (`routes/records.js`) replaces the SOP-specific `routes/sops.js`, mounted once per type in `index.js`. `vault.js` gains `createRecord` (generates the next `{PREFIX}-{YYYYMMDD}-{seq}` id and writes the file) alongside its existing `listSops`/`readSop`/`writeSop` (renamed to type-neutral names, call sites updated). AI extraction (`providers/anthropicProvider.js`, `providers/customProvider.js`) gains a `type` argument so the prompt can ask for CAP-specific fields (`root_cause`, `effectiveness_status`) instead of hardcoded SOP fields, driven by a shared `fieldSchemas.js`.

Frontend gets three generic components -- `RecordDashboard`, `RecordEditor`, `RecordIntake` -- parameterized by a blueprint + API base path, replacing the SOP-specific `Dashboard.tsx`/`SopEditor.tsx`/`Intake.tsx` logic (those become thin CAP/SOP-specific wrappers). `api/client.ts` gains a `createRecordApi(typeSlug)` factory replacing the hardcoded `/sops` URLs. CAP is wired end-to-end through this generic path; Incident/Change/Audit/Training are left as stub pages still, but the plumbing to bring each online is now "add a blueprint file + 3 route lines," not a rewrite.

**Non-goals for this pass:** Incident/Change/Audit/Training stay stubs (separate follow-up plan per type, same shape as CAP here). Cross-record linking (`related_documents` picker), Search, Evidence Library, and Settings are untouched.

**Tech Stack:** No new dependencies. Same stack as prior plans -- Express 4 / `gray-matter` / `multer` / `@anthropic-ai/sdk` backend; Vite / React 18 / TypeScript / `react-router-dom` frontend; `vitest` + `supertest` / `@testing-library/react` for tests.

---

## Before you start

Both servers run locally side by side:
- Backend: `cd app/backend && npm run start` (port 4000)
- Frontend: `cd app/frontend && npm run dev -- --port 5173`

All new backend tests mock the AI provider -- no `ANTHROPIC_API_KEY` needed until the final manual smoke test.

---

### Task 1: Generic ID generation + `createRecord` in `vault.js`

**Files:**
- Modify: `app/backend/src/vault.js`
- Modify: `app/backend/test/vault.test.js`

- [ ] **Step 1: Write the failing tests**

Add to `app/backend/test/vault.test.js`:

```js
const { listSops, readSop, writeSop, createRecord } = require('../src/vault');

describe('createRecord', () => {
  it('generates the next sequence number for the given prefix and date', () => {
    fs.writeFileSync(path.join(tmpDir, 'CAP-20260722-001.md'), '---\nid: CAP-20260722-001\n---\nbody', 'utf8');
    const { filename, frontmatter } = createRecord(tmpDir, 'CAP', { status: 'Draft' }, '# New CAP\n');
    expect(filename).toBe('CAP-20260722-002.md');
    expect(frontmatter.id).toBe('CAP-20260722-002');
    expect(frontmatter.status).toBe('Draft');
  });

  it('starts sequence at 001 when no records exist yet for today', () => {
    const { filename } = createRecord(tmpDir, 'INC', { status: 'Draft' }, 'body');
    expect(filename).toMatch(/^INC-\d{8}-001\.md$/);
  });

  it('persists the file so a subsequent readSop finds it', () => {
    const { filename } = createRecord(tmpDir, 'CHG', { status: 'Draft' }, '# Body\n');
    const record = readSop(tmpDir, filename);
    expect(record.frontmatter.status).toBe('Draft');
  });
});
```

- [ ] **Step 2: Run to verify failure**

`cd app/backend && npx vitest run test/vault.test.js` -- expect `createRecord is not a function`.

- [ ] **Step 3: Implement `createRecord`**

Add to `app/backend/src/vault.js`:

```js
function nextSequence(dir, prefix, dateStr) {
  const idPattern = new RegExp(`^${prefix}-${dateStr}-(\\d{3})\\.md$`);
  const existing = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  const seqs = existing
    .map((f) => f.match(idPattern))
    .filter(Boolean)
    .map((m) => Number(m[1]));
  const next = seqs.length > 0 ? Math.max(...seqs) + 1 : 1;
  return String(next).padStart(3, '0');
}

function createRecord(dir, idPrefix, frontmatter, body) {
  fs.mkdirSync(dir, { recursive: true });
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = nextSequence(dir, idPrefix, dateStr);
  const id = `${idPrefix}-${dateStr}-${seq}`;
  const filename = `${id}.md`;
  const fullFrontmatter = { ...frontmatter, id };
  writeSop(dir, filename, fullFrontmatter, body);
  return { filename, frontmatter: fullFrontmatter };
}

module.exports = { listSops, readSop, writeSop, createRecord };
```

- [ ] **Step 4: Run to verify pass**

`npx vitest run test/vault.test.js` -- expect PASS (all tests, old + new 3).

- [ ] **Step 5: Commit**

```bash
git add app/backend/src/vault.js app/backend/test/vault.test.js
git commit -m "feat: add createRecord with per-type ID sequencing to vault module"
```

---

### Task 2: `RECORD_TYPES` registry in `config.js`

**Files:**
- Modify: `app/backend/src/config.js`
- Modify: `app/backend/test/config.test.js`

- [ ] **Step 1: Write the failing test**

Add to `app/backend/test/config.test.js`:

```js
const { RECORD_TYPES } = require('../src/config');

describe('RECORD_TYPES', () => {
  it('maps each URL slug to a vault dir and ID prefix', () => {
    expect(RECORD_TYPES.sop).toMatchObject({ idPrefix: 'SOP' });
    expect(RECORD_TYPES.cap).toMatchObject({ idPrefix: 'CAP' });
    expect(RECORD_TYPES.incident).toMatchObject({ idPrefix: 'INC' });
    expect(RECORD_TYPES.change).toMatchObject({ idPrefix: 'CHG' });
    expect(RECORD_TYPES.audit).toMatchObject({ idPrefix: 'AUD' });
    expect(RECORD_TYPES.training).toMatchObject({ idPrefix: 'TRN' });
    expect(RECORD_TYPES.cap.dir.endsWith(require('path').join('qa-brain', 'CAP'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure** -- `npx vitest run test/config.test.js`

- [ ] **Step 3: Implement**

Replace `app/backend/src/config.js` contents with:

```js
const path = require('path');

const VAULT_ROOT = path.resolve(__dirname, '..', '..', '..', 'qa-brain');

function vaultDir(folder, envOverride) {
  return envOverride ? path.resolve(envOverride) : path.join(VAULT_ROOT, folder);
}

const SOP_DIR = vaultDir('SOP', process.env.VAULT_SOP_DIR);

const RECORD_TYPES = {
  sop: { idPrefix: 'SOP', dir: SOP_DIR },
  cap: { idPrefix: 'CAP', dir: vaultDir('CAP', process.env.VAULT_CAP_DIR) },
  incident: { idPrefix: 'INC', dir: vaultDir('INCIDENT', process.env.VAULT_INCIDENT_DIR) },
  change: { idPrefix: 'CHG', dir: vaultDir('CHANGE', process.env.VAULT_CHANGE_DIR) },
  audit: { idPrefix: 'AUD', dir: vaultDir('AUDIT', process.env.VAULT_AUDIT_DIR) },
  training: { idPrefix: 'TRN', dir: vaultDir('TRAINING', process.env.VAULT_TRAINING_DIR) },
};

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || null;

module.exports = { SOP_DIR, RECORD_TYPES, SESSION_SECRET, AUTH_PASSWORD };
```

- [ ] **Step 4: Run to verify pass** -- `npx vitest run test/config.test.js`

- [ ] **Step 5: Commit**

```bash
git add app/backend/src/config.js app/backend/test/config.test.js
git commit -m "feat: add RECORD_TYPES registry for all 6 vault record types"
```

---

### Task 3: Generic `routes/records.js` router (replaces `routes/sops.js`)

**Files:**
- Create: `app/backend/src/routes/records.js`
- Create: `app/backend/test/records.route.test.js`
- Delete: `app/backend/src/routes/sops.js`, `app/backend/test/sops.route.test.js` (superseded -- port their assertions into the new test file first)

- [ ] **Step 1: Port existing SOP route assertions + add create-route assertions**

Create `app/backend/test/records.route.test.js` (adapt fixtures/assertions from the old `sops.route.test.js`, plus):

```js
const { describe, it, expect, beforeEach, afterEach } = require('vitest');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');
const { createRecordsRouter } = require('../src/routes/records');

const FIXTURE = `---
id: CAP-20260101-001
type: CAP
status: Draft
version: "1.0"
owner: Joseph Childree
review_date: 2026-01-01
department: QA
tags: []
root_cause: 
effectiveness_status: Pending
---

# Fixture CAP
`;

let tmpDir;
let app;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-vault-'));
  fs.writeFileSync(path.join(tmpDir, 'CAP-20260101-001.md'), FIXTURE, 'utf8');
  app = express();
  app.use(express.json());
  app.use('/api', createRecordsRouter('cap', 'CAP', tmpDir));
});

afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

describe('GET /api/cap', () => {
  it('lists all records in the type dir', async () => {
    const res = await request(app).get('/api/cap');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('CAP-20260101-001');
  });
});

describe('GET /api/cap/:filename', () => {
  it('returns frontmatter and body', async () => {
    const res = await request(app).get('/api/cap/CAP-20260101-001.md');
    expect(res.status).toBe(200);
    expect(res.body.frontmatter.id).toBe('CAP-20260101-001');
  });

  it('returns 404 for a missing record', async () => {
    const res = await request(app).get('/api/cap/does-not-exist.md');
    expect(res.status).toBe(404);
  });

  it('returns 400 for a path-traversal filename', async () => {
    const res = await request(app).get('/api/cap/..%2F..%2Fetc.md');
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/cap/:filename', () => {
  it('saves updated frontmatter and body', async () => {
    const res = await request(app)
      .put('/api/cap/CAP-20260101-001.md')
      .send({ frontmatter: { id: 'CAP-20260101-001', status: 'In Review' }, body: '# Updated\n' });
    expect(res.status).toBe(200);
    const getRes = await request(app).get('/api/cap/CAP-20260101-001.md');
    expect(getRes.body.frontmatter.status).toBe('In Review');
  });
});

describe('POST /api/cap', () => {
  it('creates a new record with a generated id and returns it', async () => {
    const res = await request(app)
      .post('/api/cap')
      .send({ frontmatter: { status: 'Draft', department: 'QA' }, body: '# New CAP\n' });
    expect(res.status).toBe(201);
    expect(res.body.frontmatter.id).toMatch(/^CAP-\d{8}-002$/);
    expect(res.body.filename).toMatch(/^CAP-\d{8}-002\.md$/);
  });
});
```

- [ ] **Step 2: Run to verify failure** -- `npx vitest run test/records.route.test.js`

- [ ] **Step 3: Implement `routes/records.js`**

```js
const express = require('express');
const { listSops, readSop, writeSop, createRecord } = require('../vault');

const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]*\.md$/;

function isSafeFilename(filename) {
  return SAFE_FILENAME.test(filename) && !filename.includes('..');
}

function createRecordsRouter(urlSlug, idPrefix, dir) {
  const router = express.Router();

  router.get(`/${urlSlug}`, (req, res) => {
    res.json(listSops(dir));
  });

  router.get(`/${urlSlug}/:filename`, (req, res) => {
    if (!isSafeFilename(req.params.filename)) {
      return res.status(400).json({ error: 'invalid filename' });
    }
    try {
      res.json(readSop(dir, req.params.filename));
    } catch (err) {
      res.status(404).json({ error: 'record not found' });
    }
  });

  router.put(`/${urlSlug}/:filename`, (req, res) => {
    if (!isSafeFilename(req.params.filename)) {
      return res.status(400).json({ error: 'invalid filename' });
    }
    const { frontmatter, body } = req.body;
    writeSop(dir, req.params.filename, frontmatter, body);
    res.json({ ok: true });
  });

  router.post(`/${urlSlug}`, (req, res) => {
    const { frontmatter, body } = req.body;
    const created = createRecord(dir, idPrefix, frontmatter || {}, body || '');
    res.status(201).json(created);
  });

  return router;
}

module.exports = { createRecordsRouter };
```

- [ ] **Step 4: Run to verify pass** -- `npx vitest run test/records.route.test.js` (expect PASS, 6 tests)

- [ ] **Step 5: Remove superseded files**

```bash
git rm app/backend/src/routes/sops.js app/backend/test/sops.route.test.js
```

- [ ] **Step 6: Commit**

```bash
git add app/backend/src/routes/records.js app/backend/test/records.route.test.js
git commit -m "feat: generic records router with create-record support, replaces sops-only router"
```

---

### Task 4: Type-aware AI extraction (`fieldSchemas.js` + provider changes)

**Files:**
- Create: `app/backend/src/fieldSchemas.js`
- Modify: `app/backend/src/providers/anthropicProvider.js`
- Modify: `app/backend/src/providers/customProvider.js`
- Modify: `app/backend/test/anthropicProvider.test.js`, `app/backend/test/customProvider.test.js`

- [ ] **Step 1: Write `fieldSchemas.js` (data literal, no test needed)**

```js
const FIELD_SCHEMAS = {
  sop: 'department (one of QC, QA, IT, Operations), tags (array of strings), purpose (short string), scope (short string)',
  cap: 'department (one of QC, QA, IT, Operations), tags (array of strings), root_cause (short string), effectiveness_status (one of Pending, Pass, Fail, N/A)',
  incident: 'department (one of QC, QA, IT, Operations), tags (array of strings), description (short string), detection_method (short string)',
  change: 'department (one of QC, QA, IT, Operations), tags (array of strings), change_description (short string), reason_for_change (short string)',
  audit: 'department (one of QC, QA, IT, Operations), tags (array of strings), audit_type (one of Internal, External, Supplier), scope (short string)',
  training: 'department (one of QC, QA, IT, Operations), tags (array of strings), employee_name (short string), role (short string)',
};

module.exports = { FIELD_SCHEMAS };
```

- [ ] **Step 2: Update the failing-first tests for both providers**

In `app/backend/test/anthropicProvider.test.js`, change the call site to `extractFields(fakeClient, rawText, 'cap')` and assert the prompt sent to `client.messages.create` contains `root_cause` (inspect the mock call args). Mirror the same `type` param in `customProvider.test.js`'s POST body assertion (`expect(fetchImpl).toHaveBeenCalledWith(endpoint, expect.objectContaining({ body: JSON.stringify({ rawText, type: 'cap' }) }))`).

- [ ] **Step 3: Run to verify failure** -- `npx vitest run test/anthropicProvider.test.js test/customProvider.test.js`

- [ ] **Step 4: Implement**

`app/backend/src/providers/anthropicProvider.js`:

```js
const { FIELD_SCHEMAS } = require('../fieldSchemas');

function createAnthropicProvider(client) {
  async function extractFields(rawText, type = 'sop') {
    const schema = FIELD_SCHEMAS[type] || FIELD_SCHEMAS.sop;
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Extract ${type.toUpperCase()} frontmatter fields from this raw text. Return ONLY valid JSON with keys: ${schema}. Raw text:\n\n${rawText}`,
        },
      ],
    });
    const textBlock = message.content.find((block) => block.type === 'text');
    const raw = textBlock.text.trim();
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonText = fenced ? fenced[1] : raw;
    try {
      return JSON.parse(jsonText);
    } catch (err) {
      throw new Error(`Claude returned non-JSON response: ${err.message}`);
    }
  }

  return { extractFields };
}

module.exports = { createAnthropicProvider };
```

`app/backend/src/providers/customProvider.js` -- change `extractFields(rawText)` to `extractFields(rawText, type = 'sop')` and include `type` in the POSTed body: `JSON.stringify({ rawText, type })`. Update the header comment's documented contract accordingly.

- [ ] **Step 5: Run to verify pass**

- [ ] **Step 6: Commit**

```bash
git add app/backend/src/fieldSchemas.js app/backend/src/providers app/backend/test/anthropicProvider.test.js app/backend/test/customProvider.test.js
git commit -m "feat: type-aware AI field extraction per record type"
```

---

### Task 5: Wire `intake.js`, `attachments.js`, and `index.js` for all 6 types

**Files:**
- Modify: `app/backend/src/routes/intake.js`, `app/backend/test/intake.route.test.js`
- Modify: `app/backend/src/routes/attachments.js`, `app/backend/test/attachments.route.test.js`
- Modify: `app/backend/src/index.js`

- [ ] **Step 1: Update intake route to accept `type` in the request body**

Test addition in `intake.route.test.js`: assert `provider.extractFields` (spy) is called with `(rawText, 'cap')` when `{ rawText, type: 'cap' }` is posted, and defaults to `'sop'` when `type` is omitted (back-compat with existing SOP Intake calls until Task 7 updates the frontend).

Implementation -- `routes/intake.js`:

```js
router.post('/intake/extract', async (req, res) => {
  const { rawText, type } = req.body;
  if (!rawText || !rawText.trim()) {
    return res.status(400).json({ error: 'rawText is required' });
  }
  try {
    const extracted = await provider.extractFields(rawText, type || 'sop');
    res.json(extracted);
  } catch (err) {
    res.status(502).json({ error: 'AI extraction failed', detail: err.message });
  }
});
```

- [ ] **Step 2: Generalize attachments route to take `(urlSlug, dir, provider)` and accept `?type=` for extraction**

Mirror the `records.js` pattern: `createAttachmentsRouter(urlSlug, dir, provider)`, mounted per type in `index.js`, route path `/${urlSlug}/:filename/attachments`. Pass `urlSlug` (mapped to the same key used in `FIELD_SCHEMAS`) into `provider.extractFields(text, urlSlug)`. Update `attachments.route.test.js` call sites: `createAttachmentsRouter('cap', tmpDir, fakeProvider)`, POST to `/api/cap/CAP-....md/attachments`.

- [ ] **Step 3: Run to verify pass** -- `npx vitest run test/intake.route.test.js test/attachments.route.test.js`

- [ ] **Step 4: Rewrite `index.js` to mount all 6 types**

```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { RECORD_TYPES, SESSION_SECRET, AUTH_PASSWORD } = require('./config');
const { getProvider } = require('./providers');
const { createRecordsRouter } = require('./routes/records');
const { createIntakeRouter } = require('./routes/intake');
const { createAttachmentsRouter } = require('./routes/attachments');
const { createAuthRouter } = require('./routes/auth');
const { createRequireAuth } = require('./middleware/requireAuth');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api', createAuthRouter(SESSION_SECRET, AUTH_PASSWORD));

const requireAuth = createRequireAuth(SESSION_SECRET);
const provider = getProvider();

app.use('/api/intake', requireAuth);
app.use('/api', createIntakeRouter(provider));

for (const [slug, { idPrefix, dir }] of Object.entries(RECORD_TYPES)) {
  app.use(`/api/${slug}`, requireAuth);
  app.use('/api', createRecordsRouter(slug, idPrefix, dir));
  app.use('/api', createAttachmentsRouter(slug, dir, provider));
}

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  if (!AUTH_PASSWORD) console.warn('WARNING: AUTH_PASSWORD is not set -- login will reject all attempts. Set it in .env.');
  if (!process.env.SESSION_SECRET) console.warn('WARNING: SESSION_SECRET is not set -- using an insecure default from source control. Set it in .env.');
  app.listen(PORT, () => console.log(`QA-Brain backend listening on ${PORT}`));
}

module.exports = app;
```

- [ ] **Step 5: Run full backend suite** -- `npx vitest run` (all tests, all types)

- [ ] **Step 6: Commit**

```bash
git add app/backend/src/routes/intake.js app/backend/src/routes/attachments.js app/backend/src/index.js app/backend/test/intake.route.test.js app/backend/test/attachments.route.test.js
git commit -m "feat: mount records/intake/attachments routes for all 6 record types"
```

---

### Task 6: Frontend `createRecordApi` factory + `capBlueprint.ts`

**Files:**
- Modify: `app/frontend/src/api/client.ts`, `app/frontend/src/api/client.test.ts`
- Create: `app/frontend/src/blueprint/capBlueprint.ts`

- [ ] **Step 1: Write failing tests for the generic API factory**

Add to `client.test.ts`:

```ts
import { createRecordApi } from './client';

describe('createRecordApi', () => {
  const capApi = createRecordApi('cap');

  it('lists records at /api/cap', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'CAP-1' }] });
    const result = await capApi.list();
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/cap', { credentials: 'include' });
    expect(result).toEqual([{ id: 'CAP-1' }]);
  });

  it('creates a record via POST /api/cap', async () => {
    (fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ filename: 'CAP-1.md', frontmatter: {} }) });
    await capApi.create({ status: 'Draft' }, 'body');
    expect(fetch).toHaveBeenCalledWith('http://localhost:4000/api/cap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ frontmatter: { status: 'Draft' }, body: 'body' }),
    });
  });
});
```

- [ ] **Step 2: Run to verify failure**

- [ ] **Step 3: Implement `createRecordApi` in `client.ts`** (keep existing `listSops`/`getSop`/`saveSop`/`extractFromText`/`uploadAttachment` as-is for back-compat with `Dashboard.tsx`/`SopEditor.tsx`/`Intake.tsx` until Task 7 migrates them):

```ts
export interface RecordSummary {
  id: string;
  status: string;
  version: string;
  department: string;
  review_date: string;
  owner: string;
  filename: string;
}

export interface RecordDetail {
  frontmatter: Record<string, unknown>;
  body: string;
  filename: string;
}

export function createRecordApi(typeSlug: string) {
  const base = `${BASE_URL}/${typeSlug}`;

  return {
    async list(): Promise<RecordSummary[]> {
      const res = await fetch(base, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to load ${typeSlug} records`);
      return res.json();
    },
    async get(filename: string): Promise<RecordDetail> {
      const res = await fetch(`${base}/${filename}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Failed to load ${typeSlug} record`);
      return res.json();
    },
    async save(filename: string, frontmatter: Record<string, unknown>, body: string): Promise<void> {
      const res = await fetch(`${base}/${filename}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ frontmatter, body }),
      });
      if (!res.ok) throw new Error(`Failed to save ${typeSlug} record`);
    },
    async create(frontmatter: Record<string, unknown>, body: string): Promise<RecordDetail> {
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ frontmatter, body }),
      });
      if (!res.ok) throw new Error(`Failed to create ${typeSlug} record`);
      return res.json();
    },
    async extract(rawText: string): Promise<Record<string, unknown>> {
      const res = await fetch(`${BASE_URL}/intake/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rawText, type: typeSlug }),
      });
      if (!res.ok) throw new Error('Extraction failed');
      return res.json();
    },
  };
}
```

- [ ] **Step 4: Run to verify pass**

- [ ] **Step 5: Write `capBlueprint.ts`** (mirrors `sopBlueprint.ts`, adds CAP-only fields):

```ts
import { BlueprintField } from './sopBlueprint';

export const capBlueprint: BlueprintField[] = [
  { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'In Review', 'Approved', 'Obsolete'], required: true },
  { key: 'version', label: 'Version', type: 'text', required: true },
  { key: 'owner', label: 'Owner', type: 'text', required: true },
  { key: 'approved_by', label: 'Approved By', type: 'text' },
  { key: 'effective_date', label: 'Effective Date', type: 'date' },
  { key: 'review_date', label: 'Review Date', type: 'date', required: true },
  { key: 'department', label: 'Department', type: 'select', options: ['QC', 'QA', 'IT', 'Operations'], required: true },
  { key: 'tags', label: 'Tags', type: 'tags' },
  { key: 'root_cause', label: 'Root Cause', type: 'text' },
  { key: 'effectiveness_status', label: 'Effectiveness Status', type: 'select', options: ['Pending', 'Pass', 'Fail', 'N/A'], required: true },
];
```

- [ ] **Step 6: Commit**

```bash
git add app/frontend/src/api/client.ts app/frontend/src/api/client.test.ts app/frontend/src/blueprint/capBlueprint.ts
git commit -m "feat: generic createRecordApi factory and CAP field blueprint"
```

---

### Task 7: Generic `RecordDashboard` / `RecordEditor` / `RecordIntake` components

**Files:**
- Create: `app/frontend/src/components/RecordDashboard.tsx`, `.test.tsx`
- Create: `app/frontend/src/components/RecordEditor.tsx`, `.test.tsx`
- Create: `app/frontend/src/components/RecordIntake.tsx`, `.test.tsx`

- [ ] **Step 1: `RecordDashboard`** -- same grouping logic as `Dashboard.tsx` (`isOverdue`, controlled/overdue/draft-review/obsolete sections + `SopTable`), but takes `api: ReturnType<typeof createRecordApi>` and `title: string` as props instead of importing `listSops` directly. Write the failing test first (adapt `Dashboard.test.tsx`, injecting a fake `api.list` via props instead of `vi.spyOn` on a module import), then implement by lifting the existing `Dashboard.tsx` body and parameterizing the two hardcoded bits (the `listSops` call and the section heading text, e.g. `All Controlled ${title}s`).

- [ ] **Step 2: `RecordEditor`** -- same lift from `SopEditor.tsx`, parameterized by `api`, `blueprint: BlueprintField[]`, `filename: string`.

- [ ] **Step 3: `RecordIntake`** -- same lift from `Intake.tsx`, parameterized by `api`, `blueprint`, and an `onSave: (frontmatter, body) => Promise<void>` callback that calls `api.create` and navigates to the new record's editor route on success (this is the fix for gap #1 -- Intake currently has no save step at all).

- [ ] **Step 4: Run all three test files, verify pass**

- [ ] **Step 5: Commit**

```bash
git add app/frontend/src/components/RecordDashboard.tsx app/frontend/src/components/RecordDashboard.test.tsx app/frontend/src/components/RecordEditor.tsx app/frontend/src/components/RecordEditor.test.tsx app/frontend/src/components/RecordIntake.tsx app/frontend/src/components/RecordIntake.test.tsx
git commit -m "feat: generic RecordDashboard/RecordEditor/RecordIntake components"
```

---

### Task 8: Wire CAP end-to-end, retrofit SOP onto the generic components

**Files:**
- Modify: `app/frontend/src/pages/CapPage.tsx` → split into `CapDashboard.tsx`, `CapEditor.tsx`, `CapIntake.tsx` (thin wrappers around the Task 7 components + `capBlueprint` + `createRecordApi('cap')`)
- Modify: `app/frontend/src/App.tsx` -- replace the single `/cap` stub route with `/cap`, `/cap/new`, `/cap/:filename`
- Modify: `app/frontend/src/pages/Overview.tsx` -- remove `'CAP'` from `STUB_TYPES`, add a live CAP count card (same shape as the existing SOP card)
- Delete: old `CapPage.tsx` stub content, `CapPage.test.tsx` placeholder assertion

- [ ] **Step 1: Write `CapPage.test.tsx` → split into three test files** mirroring `Dashboard.test.tsx`/`SopEditor.test.tsx`/`Intake.test.tsx`, but asserting against the CAP API base URL (`http://localhost:4000/api/cap`) and CAP-specific fields (`root_cause`, `effectiveness_status`).

- [ ] **Step 2: Run to verify failure**

- [ ] **Step 3: Implement the three thin wrapper pages**

```tsx
// CapDashboard.tsx
import { RecordDashboard } from '../components/RecordDashboard';
import { createRecordApi } from '../api/client';

const capApi = createRecordApi('cap');

export function CapDashboard() {
  return <RecordDashboard api={capApi} title="CAP" />;
}
```

(`CapEditor.tsx`, `CapIntake.tsx` follow the same one-liner pattern, wiring `capApi` + `capBlueprint` into `RecordEditor`/`RecordIntake`.)

- [ ] **Step 4: Update `App.tsx` routing**

```tsx
import { CapDashboard } from './pages/CapDashboard';
import { CapEditor } from './pages/CapEditor';
import { CapIntake } from './pages/CapIntake';
// ...
<Route path="/cap" element={<CapDashboard />} />
<Route path="/cap/new" element={<CapIntake />} />
<Route path="/cap/:filename" element={<CapEditorRoute />} />
```

- [ ] **Step 5: Update `Overview.tsx`** to fetch both `listSops()` and `capApi.list()`, render CAP as a live card (same treatment as the existing SOP card) and drop it from `STUB_TYPES`.

- [ ] **Step 6: Run full frontend suite** -- `cd app/frontend && npx vitest run`

- [ ] **Step 7: Manual smoke test**

With both servers running and a real `.env` (`ANTHROPIC_API_KEY`, `AUTH_PASSWORD`, `SESSION_SECRET`):
1. Log in, navigate to `/cap/new`.
2. Paste raw CAP notes, click Extract, verify `root_cause`/`effectiveness_status` populate.
3. Click Save (new "Save" affordance added in Task 7's `RecordIntake`), verify redirect to `/cap/<new-filename>` and that a new file appears in `qa-brain/CAP/`.
4. Navigate to `/cap`, verify the new record shows in the dashboard.
5. Navigate to `/` (Overview), verify CAP now shows a live count instead of "not yet available."

- [ ] **Step 8: Commit**

```bash
git add app/frontend/src/pages app/frontend/src/App.tsx app/frontend/src/pages/Overview.tsx
git commit -m "feat: wire CAP end-to-end through generic record components"
```

---

## After this plan lands

Incident, Change, Audit, and Training each become a copy of Task 8 alone (blueprint file + 3 thin wrapper pages + 3 route lines + drop from `STUB_TYPES`) -- no backend work, since Tasks 1-5 already generalized the whole stack. Suggest one follow-up plan per remaining type, or a single combined plan covering all 4 given how mechanical the pattern now is.
