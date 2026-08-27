# Email Delivery via SMTP & Scheduled Digest Implementation Plan

**Wave:** 15 (last -- after every other index.js-touching plan so index.js edits stay serialized)
**Consumes:** due/overdue detection concept from alert-engine-backend-api (Wave 7) -- implements its own getOverdueRecordsForUser rather than calling GET /api/alerts, per the original leaf plan; no hard blocking dependency
**Produces:** SMTP digest scheduler; user email preferences endpoints
**Owns exclusively:** app/backend/package.json, app/backend/src/config.js, app/backend/src/users.js, app/backend/src/email.js, app/backend/src/digest.js, app/backend/src/routes/users.js, app/backend/src/scheduler.js, app/backend/src/index.js (scheduler wiring)

> **For agentic workers:** Use `subagent-driven-development` or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email alert delivery to the QA Brain backend using existing SMTP credentials (stored outside repo). Authenticated users can opt in to receive daily/weekly digest emails listing their overdue or due-soon records (SOPs needing review, CAPs pending effectiveness check, Incidents with open actions, etc.). No frontend UI in this pass — opt-in is API-driven only; scheduled digests run as a daemon job in the backend.

**Scope:**
1. Read SMTP host/port/user/pass from env vars (following existing `VAULT_*_DIR` pattern in `config.js`).
2. Add `email` field (string, nullable) + `emailOptIn` (boolean) to user schema in `users.js`.
3. Create email service module wrapping nodemailer, with digest templates.
4. Add API endpoint (`POST /api/users/preferences`) so users can set email + opt-in preference.
5. Set up cron-based scheduler (`node-cron`) to run daily digest job.
6. Digest job fetches overdue/due records per user, formats HTML email, sends via SMTP.
7. Manual testing with a test SMTP account (e.g., Mailtrap, local Mailhog, or user-provided creds).

**Non-goals:** Push notifications, in-app UI for preferences, SMS alerts, real-time notifications. Audit trails of sent emails (log entries are OK; database schema is not).

**Tech stack:** `nodemailer` + `node-cron` added to `app/backend/package.json`. No frontend changes. Config follows existing pattern in `config.js`.

**Context for overdue detection:**
- SOPs: `review_date` is YYYY-MM-DD; overdue if `review_date < today` and `status !== Obsolete`.
- CAPs: `review_date` + `effectiveness_status: Pending`; overdue if review is past due.
- Incidents: no review_date field; include active incidents (status `Draft` or `In Review`) if owner is set.
- Changes, Audits, Training, Meetings: `review_date` same logic as SOPs.
- Notes: exempt (no status/review_date fields).

---

## Before you start

**Env vars needed for testing:**
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password-here
SMTP_FROM_EMAIL=qa-brain-alerts@example.com  # sender address
DIGEST_SCHEDULE=0 9 * * * (cron: daily 9 AM) -- or whatever the user's TZ/preference is
```

Both servers run locally:
- Backend: `cd app/backend && npm run start` (port 4000)
- Frontend: `cd app/frontend && npm run dev -- --port 5173`

---

### Task 1: Add SMTP config to `config.js` + install `nodemailer` and `node-cron`

- [ ] Run `cd app/backend && npm install nodemailer node-cron` to add dependencies.
- [ ] Edit `app/backend/package.json` and verify `nodemailer` and `node-cron` are in `dependencies` (not devDependencies).
- [ ] Edit `app/backend/src/config.js`: add SMTP env var reads following the existing `VAULT_*_DIR` pattern:
  ```javascript
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'noreply@qa-brain.local';
  const DIGEST_SCHEDULE = process.env.DIGEST_SCHEDULE || '0 9 * * *'; // cron: 9 AM daily
  ```
- [ ] Export all five SMTP vars from `config.js` module.exports.
- [ ] No validation yet (Task 3 gates email service startup); just read and pass through.

### Task 2: Extend user schema — add `email` + `emailOptIn` fields to `users.js`

- [ ] Edit `app/backend/src/users.js`: update `upsertUser()` to preserve/add `email` and `emailOptIn` fields:
  ```javascript
  // Around line 55-62 (existing user merge):
  users[idx] = {
    ...existing,
    salt,
    hash,
    role: role || existing.role || 'user',
    email: existing.email || null,           // ADD
    emailOptIn: existing.emailOptIn ?? false, // ADD, default false
    setupTokenHash: null,
    setupTokenExpires: null,
  };
  // And line 64 (new user creation):
  users.push({
    username, salt, hash, role: role || 'user', active: true,
    email: null,          // ADD
    emailOptIn: false,    // ADD
    setupTokenHash: hashToken(token), setupTokenExpires: Date.now() + SETUP_TOKEN_TTL_MS
  });
  ```
- [ ] Update `createPendingUser()` (line 77) to initialize `email: null, emailOptIn: false` in the pushed user object.
- [ ] Update `listUsersSafe()` (line 139) to include email and emailOptIn in the returned admin listing (they're safe to expose to admin, not secrets).
- [ ] Add a new function `updateUserPreferences(usersFile, username, { email, emailOptIn } = {})` that updates only email/emailOptIn fields:
  ```javascript
  function updateUserPreferences(usersFile, username, { email, emailOptIn } = {}) {
    const users = loadUsers(usersFile);
    const idx = users.findIndex((u) => u.username === username);
    if (idx < 0) throw new Error(`user '${username}' not found`);
    users[idx] = {
      ...users[idx],
      ...(email !== undefined ? { email } : {}),
      ...(emailOptIn !== undefined ? { emailOptIn } : {}),
    };
    saveUsers(usersFile, users);
  }
  ```
- [ ] Export `updateUserPreferences` from `users.js`.

### Task 3: Create email service module `app/backend/src/email.js`

- [ ] New file `app/backend/src/email.js`: import nodemailer, config SMTP vars, validate on startup:
  ```javascript
  const nodemailer = require('nodemailer');
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL } = require('./config');

  let transporter = null;

  function initEmailService() {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn('WARNING: SMTP not configured. Email delivery disabled. Set SMTP_HOST, SMTP_USER, SMTP_PASS to enable.');
      return;
    }
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }

  function isEmailServiceReady() {
    return transporter !== null;
  }

  async function sendEmail(to, subject, html) {
    if (!transporter) {
      console.log(`[OFFLINE] Email to ${to}: ${subject}`);
      return;
    }
    await transporter.sendMail({
      from: SMTP_FROM_EMAIL,
      to,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, ''), // basic html -> text fallback
    });
  }

  module.exports = { initEmailService, isEmailServiceReady, sendEmail };
  ```
- [ ] Export `initEmailService`, `isEmailServiceReady`, `sendEmail`.

### Task 4: Create digest template + digest builder `app/backend/src/digest.js`

- [ ] New file `app/backend/src/digest.js`: functions to fetch overdue records and build HTML digest email:
  ```javascript
  const fs = require('fs');
  const path = require('path');
  const { listSops } = require('./vault');
  const { RECORD_TYPES } = require('./config');

  // Fetch overdue/due-soon records for a given user.
  // Simple heuristic: review_date in the past and status !== Obsolete.
  function getOverdueRecordsForUser(username) {
    const overdue = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const [type, { dir }] of Object.entries(RECORD_TYPES)) {
      if (type === 'notes') continue; // notes have no review_date
      try {
        const records = listSops(dir);
        records.forEach((rec) => {
          if (!rec.review_date) return; // no review date set
          if (rec.review_date < today && rec.status !== 'Obsolete') {
            overdue.push({ ...rec, type });
          }
        });
      } catch (err) {
        // dir may not exist yet; skip
      }
    }

    return overdue.sort((a, b) => a.review_date.localeCompare(b.review_date));
  }

  function buildDigestHtml(username, overdueRecords) {
    if (overdueRecords.length === 0) {
      return `<p>No overdue records.</p>`;
    }
    let html = `<h2>Overdue Records for ${username}</h2><ul>`;
    overdueRecords.forEach((rec) => {
      html += `<li><strong>[${rec.type}]</strong> ${rec.id}: ${rec.title || rec.filename} (due ${rec.review_date})</li>`;
    });
    html += `</ul>`;
    return html;
  }

  module.exports = { getOverdueRecordsForUser, buildDigestHtml };
  ```
- [ ] This is a minimum MVP — can be expanded later with better HTML templates, filtering by department, etc.

### Task 5: Add user preferences API endpoint `routes/users.js`

- [ ] Edit `app/backend/src/routes/users.js` (or create if it doesn't exist — check current structure):
  ```javascript
  const express = require('express');
  const { updateUserPreferences, findUser } = require('../users');

  function createUsersRouter(usersFile) {
    const router = express.Router();

    // GET /api/users/me/preferences -- return current user's email settings
    router.get('/users/me/preferences', (req, res) => {
      if (!req.user) return res.status(401).json({ error: 'not authenticated' });
      const user = findUser(usersFile, req.user);
      if (!user) return res.status(404).json({ error: 'user not found' });
      res.json({ email: user.email, emailOptIn: user.emailOptIn });
    });

    // POST /api/users/me/preferences -- set email + opt-in
    router.post('/users/me/preferences', (req, res) => {
      if (!req.user) return res.status(401).json({ error: 'not authenticated' });
      const { email, emailOptIn } = req.body;
      try {
        updateUserPreferences(usersFile, req.user, { email, emailOptIn });
        res.json({ ok: true });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    return router;
  }

  module.exports = { createUsersRouter };
  ```
- [ ] Wire into `index.js`: add route after auth (requireAuth should already gate it).

### Task 6: Create scheduler job `app/backend/src/scheduler.js`

- [ ] New file `app/backend/src/scheduler.js`:
  ```javascript
  const cron = require('node-cron');
  const { DIGEST_SCHEDULE, USERS_FILE } = require('./config');
  const { loadUsers } = require('./users');
  const { getOverdueRecordsForUser, buildDigestHtml } = require('./digest');
  const { sendEmail } = require('./email');

  async function runDigestJob() {
    console.log('[Scheduler] Running digest job...');
    const users = loadUsers(USERS_FILE);
    const optedIn = users.filter((u) => u.emailOptIn && u.email);

    for (const user of optedIn) {
      try {
        const overdue = getOverdueRecordsForUser(user.username);
        if (overdue.length > 0) {
          const html = buildDigestHtml(user.username, overdue);
          await sendEmail(user.email, `QA Brain Digest: ${overdue.length} overdue records`, html);
          console.log(`[Scheduler] Sent digest to ${user.email}`);
        }
      } catch (err) {
        console.error(`[Scheduler] Error sending digest to ${user.username}:`, err);
      }
    }
  }

  function startScheduler() {
    if (!DIGEST_SCHEDULE) {
      console.warn('WARNING: DIGEST_SCHEDULE not set. Digest job not scheduled.');
      return;
    }
    cron.schedule(DIGEST_SCHEDULE, runDigestJob);
    console.log(`[Scheduler] Digest job scheduled: ${DIGEST_SCHEDULE}`);
  }

  module.exports = { startScheduler, runDigestJob };
  ```

### Task 7: Wire scheduler into `index.js` startup

- [ ] Edit `app/backend/src/index.js`:
  - Add import: `const { initEmailService } = require('./email');`
  - Add import: `const { startScheduler } = require('./scheduler');`
  - In the `if (require.main === module)` block (around line 94), add after loadUsers check:
    ```javascript
    initEmailService();
    startScheduler();
    ```
- [ ] Verify the server logs show scheduler startup message when running `npm run start`.

### Task 8: Test email delivery with mock SMTP

- [ ] Set up a test SMTP server (e.g., Mailtrap free account, or run local Mailhog: `docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog`).
- [ ] Create a `.env` file in `app/backend/`:
  ```
  SMTP_HOST=localhost
  SMTP_PORT=1025
  SMTP_USER=test
  SMTP_PASS=test
  SMTP_FROM_EMAIL=qa-brain@localhost
  DIGEST_SCHEDULE=*/5 * * * * # every 5 minutes for testing
  ```
- [ ] Ensure a test user exists in `data/users.json` with `email` and `emailOptIn: true`.
- [ ] Start backend: `npm run start` — should log scheduler startup.
- [ ] Wait for digest to run (or manually call `runDigestJob()` in a REPL for faster testing).
- [ ] Check Mailhog web UI (http://localhost:8025) or Mailtrap inbox for the digest email.
- [ ] Verify email contains list of overdue records (or "No overdue records" if user has none).

### Task 9: Manual integration test

- [ ] Run both servers (backend on 4000, frontend on 5173).
- [ ] Via API (curl or frontend fetch after auth), call `POST /api/users/me/preferences` with `{ email: "test@example.com", emailOptIn: true }`.
- [ ] Verify `GET /api/users/me/preferences` returns the set values.
- [ ] Trigger digest job manually (edit `DIGEST_SCHEDULE` to run in 1 minute, restart, or call `runDigestJob()` directly).
- [ ] Confirm email is sent and arrives.
- [ ] Create a new SOP with `review_date` in the past and `status: Draft`; re-run digest.
- [ ] Verify the new SOP appears in the digest email.

### Task 10: Edge case handling & polish

- [ ] If SMTP is not configured (missing env vars), email service logs a warning and gracefully no-ops (don't crash).
- [ ] If a user's email is invalid or bounces, log the error but don't fail the entire batch (catch per-user errors).
- [ ] Digest HTML should include a simple footer with QA Brain URL or link to unsubscribe (future enhancement: store preference in user record, not just an email address).
- [ ] Update `.env.example` (if it exists) or create one documenting SMTP_* and DIGEST_SCHEDULE env vars.
- [ ] Existing tests for `users.js` should still pass (new fields are optional/default-valued, backward compatible).

### Task 11: Cleanup & verification

- [ ] Ensure no hardcoded email addresses, SMTP credentials, or test URLs in committed code.
- [ ] Run `npm run test` in `app/backend` — no regressions from new user schema fields.
- [ ] Document the feature briefly in a comment at the top of `scheduler.js` and `digest.js` for future maintainers.
- [ ] Commit with message: `Add email digest delivery via SMTP scheduler` (or similar).

---

## Verification Checklist

- [ ] `app/backend/package.json` contains `nodemailer` and `node-cron`.
- [ ] `config.js` exports `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`, `DIGEST_SCHEDULE`.
- [ ] `users.js` has `email` and `emailOptIn` fields on all user objects, with default values.
- [ ] `email.js` module initializes on startup and has a graceful offline mode.
- [ ] `digest.js` fetches overdue records and builds HTML correctly.
- [ ] `scheduler.js` starts the cron job and logs on each run.
- [ ] `routes/users.js` has `GET` and `POST /api/users/me/preferences` endpoints.
- [ ] `index.js` calls `initEmailService()` and `startScheduler()` on startup.
- [ ] Local test with mock SMTP (Mailhog or Mailtrap) shows digest emails arriving.
- [ ] Existing backend tests pass with no regressions.

