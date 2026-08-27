# Backend: VAPID Keys, Web-Push Library & Push Send Endpoint

**Wave:** 10 (after scoped-chat-draft-capability, Wave 9, so index.js edits stay serialized)
**Consumes:** none
**Produces:** VAPID keys; `broadcastPush()`; `POST /api/push/send`; this is the SOLE producer of the push route -- push-subscription-management (Wave 13) must consume it, not recreate it
**Owns exclusively:** app/backend/package.json, app/backend/src/config.js, app/backend/.env / .env.example, app/backend/src/services/pushService.js, app/backend/src/routes/push.js, app/backend/src/index.js (push route mount)

**Goal:** Generate and store VAPID keys in backend config, add the `web-push` npm dependency, and create a secure `POST /api/push/send` endpoint that accepts subscription objects and an alert payload, broadcasting push messages to all subscribed devices.

**Date created:** 2026-08-25  
**Effort estimate:** 1-1.5 hours  
**Pre-requisites:** 
- Backend runs (`cd app/backend && npm run start`)
- `app/backend/src/config.js` exists and exports config values
- `app/backend/src/index.js` has existing auth middleware and route registration patterns

---

## Context

### Current state
- Backend has no web-push integration yet
- `.env` and `config.js` exist but no VAPID keys are stored
- No `/api/push/send` endpoint exists
- Frontend will eventually have `PushManager.subscribe()` and will maintain a subscription object locally
- Alert engine endpoint (`/api/alerts`) exists; push endpoint will consume alerts and broadcast to subscribers

### What we're building
1. **VAPID key generation & storage** (`app/backend/src/config.js`): read VAPID public/private keys from env vars; generate them once if missing and log instructions
2. **web-push integration** (`app/backend/package.json`): add `web-push` npm dependency
3. **Push broadcast endpoint** (`app/backend/src/routes/push.js`): `POST /api/push/send` that accepts `{ subscriptions: PushSubscription[], payload: AlertPayload }` and broadcasts via `web-push`
4. **Route wiring** (`app/backend/src/index.js`): register push route with `requireAuth` middleware
5. **Error handling & logging**: individual subscription send failures don't fail the entire endpoint; log results

### How it fits the flow
- Frontend subscribes via `PushManager.subscribe()` and sends subscription to backend (separate "subscribe" endpoint, future task)
- Scheduler/alert consumer calls `/api/push/send` with current subscriber list + alert payload
- Backend uses `web-push` to send notifications to all subscriptions
- Clients receive push events in service worker and display notifications

### Non-goals
- Subscription storage/retrieval endpoint (frontend maintains subscriptions locally in this phase)
- Notification UI/styling (browser defaults)
- Unsubscribe handling (future task)
- Analytics of sent pushes (logging is sufficient)

---

## Step-by-Step Tasks

### Task 1: Install `web-push` dependency

**File:** `app/backend/package.json`

- [ ] Run: `cd app/backend && npm install web-push`
- [ ] Verify `web-push` appears in `dependencies` (not devDependencies)
- [ ] Commit the changes to `package-lock.json`

**Why:** `web-push` is the standard Node.js library for sending Web Push Notifications per the Web Push Protocol (RFC 8030).

---

### Task 2: Add VAPID keys to config and `.env`

**Files:** `app/backend/src/config.js`, `app/backend/.env`, `app/backend/.env.example`

**What VAPID keys are:** VAPID (Voluntary Application Server Identification) keys are an EC P-256 key pair used to authenticate the backend when sending push notifications. Browsers verify these keys match the subscription's application server.

**Generate keys once:**
- Run this in `node`:
  ```javascript
  const webpush = require('web-push');
  const { publicKey, privateKey } = webpush.generateVAPIDKeys();
  console.log('Public Key:', publicKey);
  console.log('Private Key:', privateKey);
  ```
- Copy the output keys

**Edit `app/backend/src/config.js`:**
- [ ] Add near the top (after `const path = require('path')`):
  ```javascript
  const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
  
  if (process.env.NODE_ENV === 'production' && (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY)) {
    throw new Error('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set in production -- refusing to start. Generate with: node -e "const webpush = require(\'web-push\'); const {publicKey, privateKey} = webpush.generateVAPIDKeys(); console.log(\'Public:\', publicKey); console.log(\'Private:\', privateKey);"');
  }
  
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('WARNING: VAPID keys not set. Push notifications disabled. Generate and set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env.');
  }
  ```
- [ ] Add to `module.exports` at the end:
  ```javascript
  module.exports = { 
    // ... existing exports ...
    VAPID_PUBLIC_KEY, 
    VAPID_PRIVATE_KEY 
  };
  ```

**Edit `app/backend/.env.example`:**
- [ ] Add:
  ```
  # Web Push Notifications (generate via: node -e "const webpush = require('web-push'); const {publicKey, privateKey} = webpush.generateVAPIDKeys(); console.log('Public:', publicKey); console.log('Private:', privateKey);")
  VAPID_PUBLIC_KEY=
  VAPID_PRIVATE_KEY=
  ```

**Edit `app/backend/.env`:**
- [ ] Add the generated keys:
  ```
  VAPID_PUBLIC_KEY=<your-public-key-here>
  VAPID_PRIVATE_KEY=<your-private-key-here>
  ```

---

### Task 3: Create push service module `app/backend/src/services/pushService.js`

**File path:** `app/backend/src/services/pushService.js`

**What it does:**
- Wraps `web-push` library
- Sends a payload to all subscriptions
- Returns results (success count, failure count, error details)
- Logs failures but doesn't throw

**Implementation:**
```javascript
const webpush = require('web-push');
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = require('../config');

function initializePushService() {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('Push service disabled: VAPID keys not configured.');
    return;
  }
  
  webpush.setVapidDetails(
    'mailto:example@domain.com', // Subject (arbitrary; can be hardcoded or use app name)
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

async function broadcastPush(subscriptions, payload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('Push service disabled; skipping broadcast.');
    return { success: 0, failed: 0, errors: [] };
  }

  const results = { success: 0, failed: 0, errors: [] };
  const payloadStr = JSON.stringify(payload);

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payloadStr);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        subscription: sub.endpoint?.substring(0, 50), // log endpoint prefix only
        error: error.message,
      });
      
      // 410 Gone = subscription is invalid/expired, can be removed silently
      // 400 Bad Request = likely malformed subscription
      if (error.statusCode === 410) {
        console.info(`[Push] Subscription expired: ${sub.endpoint}`);
      } else {
        console.error(`[Push] Failed to send to ${sub.endpoint}:`, error.message);
      }
    }
  }

  return results;
}

module.exports = { initializePushService, broadcastPush };
```

- [ ] Create the `services/` directory if it doesn't exist: `mkdir -p app/backend/src/services`
- [ ] Create the file and paste the code above
- [ ] Export both `initializePushService` and `broadcastPush`

---

### Task 4: Create push route `app/backend/src/routes/push.js`

**File path:** `app/backend/src/routes/push.js`

**What it does:**
- Exports `createPushRouter()` factory function (consistent with existing route pattern)
- Defines `POST /api/push/send` endpoint
- Validates input (subscriptions array, payload object)
- Calls `broadcastPush()` from push service
- Returns results JSON

**Implementation:**
```javascript
const express = require('express');
const { broadcastPush } = require('../services/pushService');

function createPushRouter() {
  const router = express.Router();

  router.post('/push/send', async (req, res) => {
    try {
      const { subscriptions, payload } = req.body;

      // Validation
      if (!Array.isArray(subscriptions)) {
        return res.status(400).json({ error: 'subscriptions must be an array' });
      }
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'payload must be an object' });
      }
      if (subscriptions.length === 0) {
        return res.status(400).json({ error: 'subscriptions array is empty' });
      }

      // Validate subscription structure (must have endpoint and keys)
      for (const sub of subscriptions) {
        if (!sub.endpoint) {
          return res.status(400).json({ error: 'subscription missing endpoint' });
        }
        if (!sub.keys || !sub.keys.auth || !sub.keys.p256dh) {
          return res.status(400).json({ error: 'subscription missing encryption keys' });
        }
      }

      // Broadcast
      const results = await broadcastPush(subscriptions, payload);

      res.json({
        success: true,
        summary: {
          sent: results.success,
          failed: results.failed,
          total: subscriptions.length,
        },
        errors: results.errors.length > 0 ? results.errors : undefined,
      });
    } catch (error) {
      console.error('[Push] Route error:', error);
      res.status(500).json({ error: 'internal server error' });
    }
  });

  return router;
}

module.exports = { createPushRouter };
```

- [ ] Create the file and paste the code above
- [ ] Ensure `createPushRouter` is exported

---

### Task 5: Wire push route into `app/backend/src/index.js`

**File:** `app/backend/src/index.js`

- [ ] Add import at the top with other route imports:
  ```javascript
  const { createPushRouter } = require('./routes/push');
  ```

- [ ] Add this line after the other protected routes (around line 85, before the error handler):
  ```javascript
  app.use('/api/push', requireAuth);
  app.use('/api', createPushRouter());
  ```

- [ ] Also add the push service initialization in the startup section (around line 94, after `getProvider()`):
  ```javascript
  const { initializePushService } = require('./services/pushService');
  initializePushService();
  ```

**Why requireAuth:** Only authenticated users can trigger push broadcasts; unauthed clients cannot spam notifications.

---

### Task 6: Test the endpoint manually

**Setup:**
- [ ] Ensure backend is running: `cd app/backend && npm run start`
- [ ] Backend should log: `Push service initialized` or `Push service disabled: VAPID keys not configured.`

**Test with curl:**
```bash
# Example subscription object (real one from browser); replace with actual
SUBSCRIPTION='{"endpoint":"https://fcm.googleapis.com/...","expirationTime":null,"keys":{"p256dh":"...","auth":"..."}}'

# Send test push
curl -X POST http://localhost:4000/api/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<your-session-cookie>" \
  -d "{
    \"subscriptions\": [$SUBSCRIPTION],
    \"payload\": {
      \"title\": \"Test Alert\",
      \"body\": \"This is a test push notification\",
      \"tag\": \"test-alert\"
    }
  }"
```

**Expected response:**
- Status `200 OK` if VAPID keys are set:
  ```json
  {
    "success": true,
    "summary": {
      "sent": 1,
      "failed": 0,
      "total": 1
    }
  }
  ```
- Status `200 OK` if VAPID keys are NOT set (graceful degradation):
  ```json
  {
    "success": true,
    "summary": {
      "sent": 0,
      "failed": 0,
      "total": 0
    }
  }
  ```

**Error cases:**
- Missing `subscriptions` or `payload`: `400 Bad Request`
- Invalid subscription format: `400 Bad Request`
- Empty subscriptions array: `400 Bad Request`
- Network error sending to push service: `200 OK` with `errors` array populated

---

### Task 7: Verify and commit

- [ ] Run backend tests if they exist: `cd app/backend && npm test`
- [ ] Check git status and commit:
  ```bash
  git add app/backend/src/config.js
  git add app/backend/src/routes/push.js
  git add app/backend/src/services/pushService.js
  git add app/backend/src/index.js
  git add app/backend/package.json
  git add app/backend/package-lock.json
  git add app/backend/.env.example
  git commit -m "Add VAPID config and POST /api/push/send endpoint"
  ```

---

## Verification Checklist

- [ ] `web-push` is in `dependencies` in `package.json`
- [ ] `app/backend/src/config.js` exports `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`
- [ ] `app/backend/src/services/pushService.js` exists with `broadcastPush()` function
- [ ] `app/backend/src/routes/push.js` exists with `POST /api/push/send` endpoint
- [ ] Push route is wired in `index.js` with `requireAuth` middleware
- [ ] Push service is initialized on backend startup
- [ ] `.env.example` includes VAPID key fields
- [ ] Manual curl test of `/api/push/send` returns appropriate response
- [ ] Backend logs push send attempts (success/failure)
- [ ] VAPID keys are NOT committed to `.env` (only `.env.example` template is in git)

---

## Next Steps (Future Tasks)

1. **Frontend subscription registration** — add `ServiceWorkerContainer.pushManager.subscribe()` route to store subscription on backend
2. **Service worker push event handler** — handle incoming push notifications and display as system notifications
3. **Alert scheduler integration** — call `/api/push/send` when alerts are triggered
4. **Subscription lifecycle** — handle unsubscribe, expired subscriptions, re-subscribe on page load

---

## Notes

- The endpoint accepts subscriptions as input (frontend-maintained list) rather than querying a backend subscription store; this keeps the architecture simple and allows the frontend to control who receives which alerts in future phases.
- Individual subscription send failures (410 Gone, 401 Unauthorized) are logged but don't fail the entire request; the caller can decide to remove expired subscriptions from their list.
- VAPID subject line is hardcoded; can be made configurable later if needed.
- The `mailto:` in VAPID setup is arbitrary; the backend admin email or app name can be used instead.
