# Alert Engine: Due/Overdue Detection + Backend API

**Wave:** 7 (Phase B / Jarvis start -- first plan after deploy-stabilization, Wave 6, commits)
**Consumes:** none
**Produces:** `GET /api/alerts` route; `computeAlerts()`; this is the SOLE producer of the alerts route -- in-app-alerts-overview-and-badges (Wave 12) must consume it, not recreate it
**Owns exclusively:** app/backend/src/alerts.js, app/backend/src/routes/alerts.js, app/backend/src/index.js (alert route mount), src/alerts.test.js

**Goal:** Build a single backend computation layer and HTTP endpoint that detects overdue SOPs (review_date past), aging open CAPs/incidents (created date > 30 days, status Draft/In Review), and exposes them as a structured alert list. This becomes the source of truth for Overview.tsx, nav badges, push notifications, and future email/scheduler consumers — no more frontend-only isOverdue logic.

**Date created:** 2026-08-25  
**Effort estimate:** 2-3 hours  
**Pre-requisites:** Backend runs, can read vault directories via existing `listSops`/`readSop` patterns

---

## Context

### Current state
- Frontend `RecordDashboard.tsx:11-12` has `isOverdue` check: `status === 'Approved' && review_date < now`
- Overview.tsx line 188 filters all records through this logic client-side
- No backend endpoint exists yet; Overview hardcodes date comparisons
- Templates show:
  - SOP has `review_date` (defaults to +365 days from creation)
  - CAP has `created` date, no review_date; has effectiveness_status
  - INCIDENT has `created` date, no review_date
- No "aging" threshold exists for open CAPs/incidents — decision TBD

### What we're building
1. **Computation module** (`app/backend/src/alerts.js`): scan all RECORD_TYPES, parse frontmatter, return alert list
2. **Alert route** (`app/backend/src/routes/alerts.js`): GET `/api/alerts` endpoint
3. **Wiring**: register route in `app/backend/src/index.js` with `requireAuth`
4. **Alert structure**: `{ id, type, urlSlug, reason, dueDate, severity }`
5. **Threshold decision**: "aging open CAP/incident" = created date > 30 days in Draft/In Review (hardcoded in alerts.js; config later if needed)

### Consumers (next phase, not in this plan)
- Overview.tsx: replace frontend isOverdue with API call, show alert badge
- Nav badges: consume alerts to highlight record types with issues
- Push/email: scheduler polls endpoint to decide who gets notified

---

## Step-by-Step Tasks

### Task 1: Create alert computation module (`app/backend/src/alerts.js`)

**File path:** `app/backend/src/alerts.js`

**What it does:**
- Export `computeAlerts(RECORD_TYPES)` function that reads all record directories
- Returns array of alert objects: `[{id, type, urlSlug, reason, dueDate, severity}]`
- Severity: `high` (overdue now), `medium` (due within 7 days), `low` (approaching)

**Logic:**
1. For each record type (sop, cap, incident, change, audit, training, meeting):
   - Read directory with `fs.readdirSync`
   - For each .md file, parse frontmatter with `gray-matter`
   - Apply type-specific checks:
     - **SOP**: if `status === 'Approved'` and `review_date < now`, add high alert; if `review_date < now + 7 days`, add medium alert
     - **CAP**: if `status === 'Draft' || 'In Review'` and `created date > 30 days ago`, add medium alert
     - **INCIDENT**: if `status === 'Draft' || 'In Review'` and `created date > 30 days ago`, add medium alert
   - Skip all other types (change, audit, training, meeting) for now; stub return empty array
2. Return sorted by severity (high > medium > low) then dueDate (soonest first)

**Pseudocode:**
```javascript
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const AGING_DAYS = 30; // CAP/incident draft/in-review aging threshold
const WARNING_WINDOW_DAYS = 7; // SOPs due within N days get medium alert

function computeAlerts(recordTypes) {
  const alerts = [];
  const now = new Date();
  
  for (const [slug, { dir, idPrefix, urlSlug }] of Object.entries(recordTypes)) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8');
      const { data: frontmatter } = matter(raw);
      const id = frontmatter.id || file.replace(/\.md$/, '');
      
      // SOP: check review_date
      if (slug === 'sop') {
        if (frontmatter.status !== 'Approved') continue;
        if (!frontmatter.review_date) continue;
        
        const reviewDate = new Date(frontmatter.review_date);
        const daysUntil = Math.ceil((reviewDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntil < 0) {
          alerts.push({
            id,
            type: 'SOP',
            urlSlug,
            reason: `SOP review overdue since ${reviewDate.toISOString().split('T')[0]}`,
            dueDate: frontmatter.review_date,
            severity: 'high',
          });
        } else if (daysUntil <= WARNING_WINDOW_DAYS) {
          alerts.push({
            id,
            type: 'SOP',
            urlSlug,
            reason: `SOP review due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
            dueDate: frontmatter.review_date,
            severity: 'medium',
          });
        }
      }
      
      // CAP: check created date
      if (slug === 'cap') {
        if (!['Draft', 'In Review'].includes(frontmatter.status)) continue;
        if (!frontmatter.created) continue;
        
        const createdDate = new Date(frontmatter.created);
        const ageInDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        
        if (ageInDays > AGING_DAYS) {
          alerts.push({
            id,
            type: 'CAP',
            urlSlug,
            reason: `CAP open for ${ageInDays} days (created ${frontmatter.created})`,
            dueDate: frontmatter.created,
            severity: 'medium',
          });
        }
      }
      
      // INCIDENT: check created date (same logic as CAP)
      if (slug === 'incident') {
        if (!['Draft', 'In Review'].includes(frontmatter.status)) continue;
        if (!frontmatter.created) continue;
        
        const createdDate = new Date(frontmatter.created);
        const ageInDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
        
        if (ageInDays > AGING_DAYS) {
          alerts.push({
            id,
            type: 'INCIDENT',
            urlSlug,
            reason: `Incident open for ${ageInDays} days (created ${frontmatter.created})`,
            dueDate: frontmatter.created,
            severity: 'medium',
          });
        }
      }
    }
  }
  
  // Sort: severity (high > medium > low), then dueDate (soonest first)
  const severityRank = { high: 0, medium: 1, low: 2 };
  return alerts.sort((a, b) => {
    if (severityRank[a.severity] !== severityRank[b.severity]) {
      return severityRank[a.severity] - severityRank[b.severity];
    }
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
}

module.exports = { computeAlerts, AGING_DAYS, WARNING_WINDOW_DAYS };
```

**Verification checkpoint:**
- [ ] Function loads SOP directory, finds an Approved SOP with review_date in past, returns high-severity alert
- [ ] Function finds a CAP in Draft status created > 30 days ago, returns medium alert
- [ ] Function skips Draft SOPs (only Approved)
- [ ] Function skips Approved CAPs (only Draft/In Review)
- [ ] Function returns empty array for CHANGE/AUDIT/TRAINING/MEETING

---

### Task 2: Create alert HTTP route (`app/backend/src/routes/alerts.js`)

**File path:** `app/backend/src/routes/alerts.js`

**What it does:**
- Single GET endpoint: `/api/alerts`
- Returns JSON array of alert objects
- Caches result for 5 minutes (avoid re-scanning filesystem on every request)

**Implementation:**
```javascript
const express = require('express');
const { computeAlerts } = require('../alerts');
const { RECORD_TYPES } = require('../config');

function createAlertsRouter() {
  const router = express.Router();
  
  let cachedAlerts = null;
  let cacheExpiry = null;
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  router.get('/alerts', (req, res) => {
    const now = Date.now();
    
    // Invalidate cache if expired
    if (!cachedAlerts || !cacheExpiry || now > cacheExpiry) {
      cachedAlerts = computeAlerts(RECORD_TYPES);
      cacheExpiry = now + CACHE_TTL;
    }
    
    res.json(cachedAlerts);
  });
  
  return router;
}

module.exports = { createAlertsRouter };
```

**Verification checkpoint:**
- [ ] GET `/api/alerts` returns 200 with JSON array
- [ ] Response structure matches `{ id, type, urlSlug, reason, dueDate, severity }`
- [ ] Multiple calls within 5 minutes hit cache (verify by adding console.log in computeAlerts)

---

### Task 3: Wire route into Express app

**File path:** `app/backend/src/index.js` (modify)

**What to change:**
- Import `createAlertsRouter` at top
- Register router after other routes (around line 78)
- Add `requireAuth` middleware guard

**Edit location:** After line 79 (after search router), before evidence router:
```javascript
app.use('/api/alerts', requireAuth);
app.use('/api', createAlertsRouter());
```

**Modified section (lines 72-86 approximately):**
```javascript
for (const [slug, { idPrefix, dir, urlSlug }] of Object.entries(RECORD_TYPES)) {
  app.use(`/api/${urlSlug}`, requireAuth);
  app.use('/api', createRecordsRouter(urlSlug, idPrefix, dir, TRASH_DIR));
  app.use('/api', createAttachmentsRouter(urlSlug, dir, provider));
}

app.use('/api/search', requireAuth);
app.use('/api', createSearchRouter(RECORD_TYPES));

// NEW LINES:
app.use('/api/alerts', requireAuth);
app.use('/api', createAlertsRouter());

app.use('/api/evidence', requireAuth);
app.use('/api', createEvidenceRouter(RECORD_TYPES, UNLINKED_EVIDENCE_DIR));
```

**Verification checkpoint:**
- [ ] Server starts without errors
- [ ] `curl -H "Cookie: ..." http://localhost:4000/api/alerts` returns JSON (with auth)
- [ ] Same call without auth cookie returns 401

---

### Task 4: Unit test alert computation logic

**File path:** `app/backend/src/alerts.test.js` (new)

**What to test:**
1. SOP with Approved status + review_date in past → high severity alert
2. SOP with Approved status + review_date in 5 days → medium severity alert
3. SOP with Draft status (regardless of review_date) → no alert
4. CAP with Draft status + created 40 days ago → medium alert
5. CAP with Approved status + created 40 days ago → no alert (not open)
6. INCIDENT with In Review status + created 40 days ago → medium alert
7. Empty directories → empty alerts array
8. Alerts sorted by severity, then dueDate

**Minimal test framework:** Use Node's built-in `assert` module or `node --test` (Node 20+). No Jest/Vitest overhead.

**Pseudocode:**
```javascript
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { computeAlerts } = require('./alerts');

// Create temp directories + files for testing
// Run computeAlerts on them
// Assert results match expectations
// Clean up

// Example one test:
test('SOP with Approved status and overdue review_date', () => {
  const testDir = path.join(__dirname, '../..', 'test-data', 'sop');
  fs.mkdirSync(testDir, { recursive: true });
  
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const content = matter.stringify('# Test SOP', {
    id: 'SOP-20260825-001',
    type: 'SOP',
    status: 'Approved',
    review_date: yesterdayStr,
  });
  fs.writeFileSync(path.join(testDir, 'SOP-20260825-001.md'), content, 'utf8');
  
  const alerts = computeAlerts({ sop: { dir: testDir, idPrefix: 'SOP', urlSlug: 'sops' } });
  
  assert.equal(alerts.length, 1, 'Expected 1 alert');
  assert.equal(alerts[0].severity, 'high', 'Expected high severity for overdue SOP');
  assert.equal(alerts[0].type, 'SOP');
  
  // Cleanup
  fs.rmSync(testDir, { recursive: true });
});
```

**Verification checkpoint:**
- [ ] All 8 tests pass
- [ ] Test file runs without external test framework: `node app/backend/src/alerts.test.js`

---

### Task 5: Manual E2E verification

**In running backend (dev mode):**

1. **Check an existing SOP:**
   - Open a real SOP file in `qa-brain/SOP/` with Approved status and review_date in past
   - Call `curl -H "Cookie: session=..." http://localhost:4000/api/alerts` (with valid session)
   - Verify SOP id appears in response with `severity: 'high'`

2. **Check aging CAP:**
   - Open a real CAP file with Draft status and created date > 30 days ago
   - Call the same endpoint
   - Verify CAP id appears with `severity: 'medium'`

3. **Verify cache:**
   - Call endpoint twice within 10 seconds
   - Add `console.log('computeAlerts called')` in alerts.js
   - Verify second call does NOT log (cache hit)
   - Wait 5+ minutes, call again
   - Verify logs appear again (cache miss)

4. **Verify sorting:**
   - If multiple alerts exist, confirm high severity comes before medium
   - Within same severity, confirm earliest dueDate comes first

**Verification checkpoint:**
- [ ] Live endpoint returns correct alerts for real vault data
- [ ] Cache works as expected
- [ ] Auth guard blocks unauthenticated requests

---

## Notes for Next Phase

- **Threshold tuning:** AGING_DAYS (30) and WARNING_WINDOW_DAYS (7) are hardcoded; move to config.js if they need per-environment control
- **Expansion:** Currently only SOP, CAP, INCIDENT are checked; CHANGE, AUDIT, TRAINING, MEETING are stubbed; add rules as requirements clarify
- **Performance:** Current O(n) scan of all files; if vault grows to thousands of records, consider:
  - Indexing frontmatter on write (e.g., JSON index file updated whenever a record changes)
  - Scheduled pre-computation (run alerts computation on a timer, store result, serve from cache)
- **Consumers:** Next three plans should wire this endpoint into Overview.tsx, nav badges, and push/email scheduler

---

## Verification Checklist

- [ ] `app/backend/src/alerts.js` created with `computeAlerts(RECORD_TYPES)` export
- [ ] Logic correctly identifies overdue SOPs (Approved + review_date < now = high)
- [ ] Logic correctly identifies near-due SOPs (Approved + review_date within 7 days = medium)
- [ ] Logic correctly identifies aging open CAPs (Draft/In Review + created > 30 days = medium)
- [ ] Logic correctly identifies aging open incidents (Draft/In Review + created > 30 days = medium)
- [ ] All other record types (CHANGE, AUDIT, TRAINING, MEETING) skip without alerts
- [ ] `app/backend/src/routes/alerts.js` created with GET `/api/alerts` endpoint
- [ ] Alert objects have fields: `{ id, type, urlSlug, reason, dueDate, severity }`
- [ ] Route wired into `index.js` with `requireAuth` guard
- [ ] 5-minute cache prevents filesystem re-scans
- [ ] Unit tests pass (8 test cases covering the logic)
- [ ] E2E: real endpoint returns expected alerts for existing vault data
- [ ] E2E: unauthenticated requests return 401
- [ ] Server starts without errors after wiring

---

## File Paths (for reference)

| File | Action | Location |
|------|--------|----------|
| `app/backend/src/alerts.js` | Create | New file |
| `app/backend/src/routes/alerts.js` | Create | New file |
| `app/backend/src/index.js` | Modify | Lines ~78-80 (add import, wire route) |
| `app/backend/src/alerts.test.js` | Create | New file (optional but recommended) |
| `qa-brain/SOP/**` | Read only | Existing vault data for testing |
| `qa-brain/CAP/**` | Read only | Existing vault data for testing |
| `qa-brain/INCIDENT/**` | Read only | Existing vault data for testing |

---

## Success Criteria

✓ Backend endpoint `/api/alerts` exists, returns structured JSON array of alerts  
✓ Alerts correctly identify overdue SOPs (Approved + review_date < now)  
✓ Alerts correctly identify aging open CAPs/incidents (Draft/In Review + created > 30 days)  
✓ Endpoint is the single source of truth (no more frontend-only isOverdue logic in next phase)  
✓ Cache reduces filesystem I/O  
✓ Unit tests provide confidence in computation logic  
✓ Ready for Overview.tsx, nav badge, and scheduler consumers to wire in
