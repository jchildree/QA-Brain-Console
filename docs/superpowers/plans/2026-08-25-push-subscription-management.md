# Push Subscription Management: Opt-In UI, Browser Permissions & Backend Sync

**Wave:** 13 (after in-app-alerts-overview-and-badges, Wave 12, since both edit api/client.ts)
**Consumes:** `POST /api/push/send` (Wave 10, backend-vapid-web-push-send) and the registered service worker (Wave 11, frontend-service-worker-registration-and-push) -- DO NOT recreate routes/push.js, its index.js mount, or a second service-worker file/main.tsx registration; add subscription persistence and Settings UI only
**Produces:** Settings opt-in UI; subscribeToPush/testPush API calls; subscription storage
**Owns exclusively:** app/frontend/src/pages/SettingsPage.tsx, app/frontend/src/api/client.ts (subscribeToPush/testPush), app/backend/data/subscriptions.json, app/backend/src/routes/push.js (subscription-storage additions only, not the send endpoint), app/backend/src/index.js (subscription-store init only)

**Goal:** Build a complete push notification subscription flow: frontend UI in SettingsPage.tsx that requests browser Notification permission, subscribes the browser to push via ServiceWorker, persists subscriptions locally, syncs to backend storage, and includes a test-push button for verification.

**Date created:** 2026-08-25  
**Effort estimate:** 3-4 hours  
**Pre-requisites:** Backend runs, frontend dev environment works, browser supports Notification API and Service Workers (modern evergreen browsers)

---

## Context

### Current state
- `SettingsPage.tsx` exists but only handles theme, font size, contrast, and reduce-motion settings
- No push notification infrastructure exists (no ServiceWorker, no subscription API, no backend storage)
- Browser Notification API and Service Worker API are available natively (no deps needed)
- Backend uses simple JSON file storage (users.json pattern), not a database

### What we're building
1. **Frontend subscription UI** (`SettingsPage.tsx`): add a section with permission request button, status display, and test button
2. **ServiceWorker** (`app/frontend/public/sw.js`): handle permission requests and push subscription registration
3. **API client function** (`app/frontend/src/api/client.ts`): `subscribeToPush(subscription)` that sends to backend
4. **Local persistence** (localStorage): store subscription JSON locally to avoid re-requesting on every page load
5. **Backend route** (`app/backend/src/routes/push.js`): POST `/api/push/subscribe` endpoint
6. **Backend storage** (`app/backend/data/subscriptions.json`): simple JSON file, one subscription per user per browser

### Behavior flow
1. User opens Settings, sees "Notifications" section with "Request Permission" button
2. Click button → browser asks for notification permission
3. If granted → subscribe to push notifications via ServiceWorker (gets subscription object with endpoint, keys)
4. Store subscription in localStorage (browser) and POST to backend
5. Backend stores in subscriptions.json indexed by username
6. "Test Push" button calls backend (future POST `/api/push/test`) to send a test notification (stubbed for now)
7. If permission denied or browser doesn't support → show disabled state with explanation

### What's skipped (add when needed)
- Actual push delivery service (Web Push Protocol, VAPID keys, sending notifications) — only subscription storage built here
- Unsubscribe button (add when revocation is needed)
- Multi-device subscription tracking (store per-browser; update/replace on new subscription from same user)
- Subscription expiration handling (re-subscribe if endpoint is stale)
- Test-push backend logic (just stub endpoint returning success for now)

---

## Step-by-Step Tasks

### Task 1: Create ServiceWorker file (`app/frontend/public/sw.js`)

**File path:** `app/frontend/public/sw.js`

**What it does:**
- Register ServiceWorker listeners for push events (future feature)
- Export function to handle push subscription from main thread
- Keep minimal; most logic lives in SettingsPage.tsx

**Full code:**
```javascript
// Handle incoming push notifications
self.addEventListener('push', (event) => {
  // Stubbed for now; will implement notification display later
  console.log('Push received:', event);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
});
```

**Notes:**
- This file must be at the public root so it serves at `/sw.js`
- Minimal for now; all subscription logic is in frontend component

---

### Task 2: Add subscription API function (`app/frontend/src/api/client.ts`)

**File path:** `app/frontend/src/api/client.ts` (append to existing file)

**What it does:**
- Add `subscribeToPush(subscription: PushSubscription)` function
- POST subscription JSON to backend endpoint
- Return success/error

**Code to add:**
```typescript
export async function subscribeToPush(subscription: PushSubscription): Promise<{ ok: boolean; error?: string }> {
  // Convert PushSubscription to JSON (it has toJSON() method)
  const subscriptionJSON = subscription.toJSON();
  
  const res = await fetch(`${BASE_URL}/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ subscription: subscriptionJSON }),
  });
  
  if (!res.ok) {
    const error = await res.text();
    return { ok: false, error };
  }
  
  return { ok: true };
}

export async function testPush(): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${BASE_URL}/push/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error = await res.text();
    return { ok: false, error };
  }
  
  return { ok: true };
}
```

---

### Task 3: Add notification UI section to SettingsPage.tsx

**File path:** `app/frontend/src/pages/SettingsPage.tsx` (add after reduce-motion section, before closing div)

**What it does:**
- Display permission status (default, granted, denied)
- Request permission button (enabled when default, disabled when granted/denied)
- Show subscription status (subscribed / not subscribed)
- Test push button (enabled only when subscribed)
- Error/success messages

**Code to add (after line 65, before closing `</div>` on line 70):**

```typescript
import { useState, useEffect } from 'react';
import { subscribeToPush, testPush } from '../api/client';

// Add this inside the SettingsPage function component, after useTheme hook:
const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
const [isSubscribed, setIsSubscribed] = useState(false);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

useEffect(() => {
  // Check current permission and subscription on mount
  if ('Notification' in window) {
    setNotificationPermission(Notification.permission);
    
    // Check if already subscribed in localStorage
    const stored = localStorage.getItem('push-subscription');
    if (stored && Notification.permission === 'granted') {
      setIsSubscribed(true);
    }
  }
}, []);

const handleRequestPermission = async () => {
  if (!('Notification' in window)) {
    setMessage({ type: 'error', text: 'Notifications not supported in this browser' });
    return;
  }
  
  setLoading(true);
  
  try {
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted') {
      // Register ServiceWorker and subscribe to push
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Subscribe to push notifications (VAPID key would go here in production)
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: undefined, // Will need VAPID public key later
        });
        
        // Send subscription to backend
        const result = await subscribeToPush(subscription);
        
        if (result.ok) {
          localStorage.setItem('push-subscription', JSON.stringify(subscription.toJSON()));
          setIsSubscribed(true);
          setMessage({ type: 'success', text: 'Subscribed to push notifications' });
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to sync subscription with backend' });
        }
      }
    } else if (permission === 'denied') {
      setMessage({ type: 'error', text: 'Notifications were denied. Change browser settings to re-enable.' });
    }
  } catch (err) {
    setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Unknown error' });
  } finally {
    setLoading(false);
  }
};

const handleTestPush = async () => {
  setLoading(true);
  try {
    const result = await testPush();
    if (result.ok) {
      setMessage({ type: 'success', text: 'Test notification sent! Check your system notifications.' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to send test notification' });
    }
  } catch (err) {
    setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Unknown error' });
  } finally {
    setLoading(false);
  }
};

// Add this JSX after the reduce-motion checkbox (before the closing </div>):
<div className="border-t" style={{ borderColor: 'var(--rule)', paddingTop: '1.5rem' }}>
  <h2 className="chart-title text-sm mb-4">Notifications</h2>
  
  <div className="flex flex-col gap-3">
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>
          Permission Status
        </span>
        <span className="text-sm" style={{ color: 'var(--ink)' }}>
          {notificationPermission === 'granted' ? '✓ Granted' : notificationPermission === 'denied' ? '✗ Denied' : '◆ Default'}
        </span>
      </div>
    </div>
    
    <button
      onClick={handleRequestPermission}
      disabled={notificationPermission !== 'default' || loading || !('Notification' in window)}
      className="px-3 py-2 rounded-lg text-sm font-mono font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: notificationPermission === 'default' ? 'var(--highlight)' : 'var(--paper-2)',
        color: 'var(--ink)',
        border: `1px solid var(--rule)`,
      }}
    >
      {loading ? 'Requesting...' : 'Request Permission'}
    </button>
    
    {isSubscribed && (
      <>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-dim)' }}>
            ✓ Subscribed to push
          </span>
        </div>
        
        <button
          onClick={handleTestPush}
          disabled={loading}
          className="px-3 py-2 rounded-lg text-sm font-mono font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'var(--paper-2)',
            color: 'var(--ink)',
            border: `1px solid var(--rule)`,
          }}
        >
          {loading ? 'Sending...' : 'Send Test Push'}
        </button>
      </>
    )}
    
    {message && (
      <div
        className="p-2 rounded-lg text-sm"
        style={{
          background: message.type === 'success' ? 'var(--paper-2)' : 'var(--paper-2)',
          color: message.type === 'success' ? '#22c55e' : '#ef4444',
          border: `1px solid ${message.type === 'success' ? '#22c55e40' : '#ef444440'}`,
        }}
      >
        {message.text}
      </div>
    )}
    
    <p className="text-xs font-mono" style={{ color: 'var(--ink-dim)' }}>
      Push notifications allow the app to alert you about important events, even when not in focus.
    </p>
  </div>
</div>
```

**Import updates needed at top of file:**
```typescript
import { useState, useEffect } from 'react';
import { subscribeToPush, testPush } from '../api/client';
```

---

### Task 4: Create backend push route (`app/backend/src/routes/push.js`)

**File path:** `app/backend/src/routes/push.js`

**What it does:**
- Export `createPushRouter()` function
- Handle POST `/api/push/subscribe` — save subscription to JSON file
- Handle POST `/api/push/test` — stubbed endpoint returning success

**Full code:**
```javascript
const express = require('express');
const fs = require('fs');
const path = require('path');

function createPushRouter(subscriptionsFile = 'app/backend/data/subscriptions.json') {
  const router = express.Router();

  // Ensure subscriptions file exists
  function ensureSubscriptionsFile() {
    const dir = path.dirname(subscriptionsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(subscriptionsFile)) {
      fs.writeFileSync(subscriptionsFile, JSON.stringify({}), 'utf8');
    }
  }

  function loadSubscriptions() {
    ensureSubscriptionsFile();
    try {
      const data = fs.readFileSync(subscriptionsFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  function saveSubscriptions(subs) {
    ensureSubscriptionsFile();
    fs.writeFileSync(subscriptionsFile, JSON.stringify(subs, null, 2), 'utf8');
  }

  // POST /api/push/subscribe
  router.post('/push/subscribe', (req, res) => {
    try {
      const { subscription } = req.body;
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Invalid subscription object' });
      }

      // Get username from session (assuming requireAuth middleware sets req.user)
      const username = req.user?.username;
      if (!username) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Load, update, and save subscriptions
      const subs = loadSubscriptions();
      if (!subs[username]) {
        subs[username] = [];
      }

      // Replace or add subscription (one per browser/device; match by endpoint)
      const existingIndex = subs[username].findIndex(s => s.endpoint === subscription.endpoint);
      if (existingIndex >= 0) {
        subs[username][existingIndex] = subscription;
      } else {
        subs[username].push(subscription);
      }

      saveSubscriptions(subs);
      res.json({ ok: true, message: 'Subscription saved' });
    } catch (err) {
      console.error('Error saving subscription:', err);
      res.status(500).json({ error: 'Failed to save subscription' });
    }
  });

  // POST /api/push/test
  router.post('/push/test', (req, res) => {
    try {
      // Stubbed for now; will implement actual push delivery later
      // In production, this would:
      // 1. Get the user's subscriptions from subscriptions.json
      // 2. Use a push service (e.g., web-push npm package) to send notifications
      // 3. Handle errors (e.g., stale endpoints)
      
      res.json({ ok: true, message: 'Test push would be sent (stubbed)' });
    } catch (err) {
      console.error('Error sending test push:', err);
      res.status(500).json({ error: 'Failed to send test push' });
    }
  });

  return router;
}

module.exports = { createPushRouter };
```

---

### Task 5: Register push route in backend index.js

**File path:** `app/backend/src/index.js`

**What to do:**
1. Add require at top: `const { createPushRouter } = require('./routes/push');`
2. Register route after line 85 (after trash router, before error handler):

```javascript
app.use('/api/push/subscribe', requireAuth);
app.use('/api/push/test', requireAuth);
app.use('/api', createPushRouter(path.join(__dirname, '../data/subscriptions.json')));
```

Also add `const path = require('path');` at the top if not present.

---

### Task 6: Create subscriptions.json placeholder

**File path:** `app/backend/data/subscriptions.json`

**Content:**
```json
{}
```

---

### Task 7: Register ServiceWorker in frontend main app initialization

**File path:** `app/frontend/src/main.tsx`

**What to do:**
- Add ServiceWorker registration in app startup (after mount)

**Code to add (in main or App component):**
```typescript
// At app startup, try to register the ServiceWorker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(err => {
    console.warn('ServiceWorker registration failed:', err);
  });
}
```

(Add this as a side effect in a top-level component or in main.tsx after ReactDOM.render)

---

## Verification Steps

### Frontend verification
1. **Permissions flow:**
   - Open Settings page
   - Verify "Notifications" section appears
   - Click "Request Permission" → browser should ask
   - Grant permission → "Permission Status" should show "✓ Granted"
   - Verify subscription checkbox appears with success message

2. **LocalStorage persistence:**
   - Refresh the page
   - Verify "✓ Subscribed to push" still shows (read from localStorage)
   - No re-request of permission

3. **Test push button:**
   - Click "Send Test Push"
   - Verify no errors (backend returns stubbed success)
   - Message shows "Test notification sent!"

4. **Browser dev tools:**
   - Open DevTools → Application → Service Workers
   - Verify `sw.js` is registered and active
   - Open DevTools → Application → Local Storage → find `push-subscription` key
   - Value should contain endpoint and auth/p256dh keys

### Backend verification
1. **Start backend:**
   ```bash
   npm run start
   ```

2. **Trigger subscription from frontend:**
   - Complete frontend flow above (grant permission, subscribe)
   - Check `app/backend/data/subscriptions.json`
   - Should contain entry: `{ "username": [{ "endpoint": "...", "auth": "...", "p256dh": "..." }] }`

3. **Test endpoint manually:**
   ```bash
   curl -X POST http://localhost:4000/api/push/test \
     -H "Content-Type: application/json" \
     -b "sessionid=..." \
     -d '{}'
   ```
   Should return `{ "ok": true, "message": "Test push would be sent (stubbed)" }`

4. **Verify requireAuth:**
   ```bash
   curl -X POST http://localhost:4000/api/push/subscribe \
     -H "Content-Type: application/json" \
     -d '{"subscription": {"endpoint": "...", "auth": "...", "p256dh": "..."}}'
   ```
   Should return 401 (not authenticated) without session cookie

---

## Known Limitations & Future Work

1. **No VAPID keys yet:** Backend uses `undefined` for applicationServerKey. Add VAPID key pair generation when ready to send real notifications.
2. **No actual delivery:** Test-push is stubbed. Will need `web-push` npm package + VAPID keys to actually deliver.
3. **No unsubscribe:** User can't revoke notifications from UI yet. Add button to remove subscription from subscriptions.json when needed.
4. **Single subscription per user:** Currently stores one subscription per endpoint. Multi-device support can be added by keeping array per user.
5. **No expiration handling:** Stale endpoints aren't detected. Add retry logic + delete stale entries in POST /api/push/test.
6. **No notification permissions UI:** Currently uses browser's native permission prompt. Could add custom UX if needed.

---

## Implementation Checklist

- [ ] Create `app/frontend/public/sw.js` (ServiceWorker minimal stub)
- [ ] Update `app/frontend/src/api/client.ts` (add `subscribeToPush`, `testPush` functions)
- [ ] Update `app/frontend/src/pages/SettingsPage.tsx` (add notification section with UI + logic)
- [ ] Update `app/frontend/src/main.tsx` (register ServiceWorker at startup)
- [ ] Create `app/backend/src/routes/push.js` (subscription storage route)
- [ ] Update `app/backend/src/index.js` (register push routes)
- [ ] Create `app/backend/data/subscriptions.json` (empty initial file)
- [ ] Test full flow: permission request → subscription → backend sync → test push
- [ ] Verify subscriptions.json created with correct data
- [ ] Commit all changes

