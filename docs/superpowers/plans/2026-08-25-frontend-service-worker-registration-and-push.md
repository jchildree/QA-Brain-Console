# Frontend: Service Worker Registration & Push Event Handling

**Wave:** 11 (after backend-vapid-web-push-send, Wave 10)
**Consumes:** `POST /api/push/send` (Wave 10, backend-vapid-web-push-send)
**Produces:** registered service worker at /service-worker.js handling push + notificationclick; this is the SOLE producer of the frontend SW file/registration -- push-subscription-management (Wave 13) must consume it, not create its own sw.js or re-edit main.tsx's registration
**Owns exclusively:** app/frontend/public/service-worker.js, app/frontend/vite.config.ts, app/frontend/src/main.tsx (SW registration only)

> **For agentic workers:** Execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register a service worker at app startup, configure Vite to serve it, and handle incoming push events by displaying structured notifications (title, body, icon, badge) with a click handler that focuses/opens the associated record in an existing tab.

**Date created:** 2026-08-25  
**Effort estimate:** 2-3 hours  
**Pre-requisites:** 
- Backend has a push notification endpoint (e.g., `/api/notifications/send`) that delivers payloads to registered subscription endpoints
- HTTPS is enabled (required for service workers and push API in production; localhost works with http://)
- Browser supports Push API (Chrome, Firefox, Edge; Safari has limited support)

---

## Context

### Current state
- No service worker file exists in `app/frontend/public/`
- No service worker registration logic in `app/frontend/src/main.tsx`
- Vite config does not explicitly handle service worker serving
- No push event handlers or notification display logic exist
- App uses React Router and lives at `app/frontend/`

### What we're building
1. **Service worker file** (`app/frontend/public/service-worker.js`): registers for push events, displays structured notifications
2. **Vite config update** (`app/frontend/vite.config.ts`): ensure service-worker.js is served from public root as-is
3. **Registration logic** (`app/frontend/src/main.tsx`): register the service worker on app startup
4. **Push event handler**: listen for `push` events, extract title/body/icon/badge, call `self.registration.showNotification()`
5. **Notification click handler**: when user clicks a notification, focus an existing tab with that record, or open a new tab if not found

### Consumers (next phase, not in this plan)
- Backend scheduler/push-notification service that sends push events to subscribed clients
- Frontend notification permission UI (separate feature to request/track notification consent)

---

## Step-by-Step Tasks

### Task 1: Create service worker file

**File path:** `app/frontend/public/service-worker.js`

**What to do:**
- Create a new JavaScript file in the `public/` directory (not in `src/` — it must be served at `/service-worker.js`)
- Register `push` and `notificationclick` event listeners
- On `push`, extract JSON payload with structure `{ title, body, icon, badge, record }` and display notification
- On `notificationclick`, extract the `record` data from notification and attempt to focus/open the record

**Implementation:**

```javascript
// app/frontend/public/service-worker.js

// Handle incoming push events
self.addEventListener('push', (event) => {
  // Parse the push event payload (assumed to be JSON)
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      // Fallback: use plain text as title if JSON parsing fails
      data = { title: 'Notification', body: event.data.text() };
    }
  }

  const { title = 'Alert', body = '', icon = '/favicon.svg', badge = '/favicon.svg', record } = data;

  const options = {
    body,
    icon,
    badge,
    // Store record data so we can access it in notificationclick
    data: { record },
    // Make it persistent (iOS/some browsers require this)
    tag: record?.id || 'notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const record = event.notification.data?.record;
  if (!record || !record.type || !record.id) {
    // No record data, just open the home page
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
    return;
  }

  // Build the target URL based on record type and ID
  const recordType = record.type.toLowerCase();
  const targetUrl = `/${recordType}/${record.id}`;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Try to find and focus an existing window with this record open
      for (const client of clientList) {
        if (client.url.includes(targetUrl)) {
          return client.focus();
        }
      }

      // If not found, open a new tab with the record
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
```

**Notes:**
- `self.registration.showNotification()` returns a promise; wrap it in `event.waitUntil()` so the browser doesn't terminate the worker before the notification is shown.
- The `record` object is passed in the push payload and stored in notification `data` for later retrieval on click.
- `clients.matchAll()` finds all open browser windows; we check if any already have the target URL.
- Fallback: if no matching window is found, open a new tab.

---

### Task 2: Update Vite config to serve service worker from public

**File path:** `app/frontend/vite.config.ts`

**What to do:**
- Vite by default copies files from `public/` to the root of the dist directory, but we should verify the config explicitly handles service-worker.js
- Add a copyPublicDir option or ensure it's enabled (default is true)

**Current file:**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
})
```

**Updated file:**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: 'public',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
})
```

**Why:** The `publicDir: 'public'` option (which is the default) ensures Vite copies everything from the `public/` folder to the root of the dist output. This makes `service-worker.js` available at `/service-worker.js` when deployed. During dev, Vite serves it directly from `public/` at the same path.

**Verification:** After starting `npm run dev`, visit `http://localhost:5173/service-worker.js` in the browser and confirm you see the service worker code.

---

### Task 3: Register service worker in main.tsx

**File path:** `app/frontend/src/main.tsx`

**What to do:**
- Add service worker registration immediately after the React app renders (or before, doesn't matter)
- Wrap in a try/catch to handle browsers that don't support service workers
- Log success/error for debugging

**Current file:**
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Updated file:**
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/service-worker.js')
    .then((registration) => {
      console.log('Service Worker registered:', registration);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Notes:**
- Service worker registration is async and non-blocking; it won't delay app startup.
- The check `'serviceWorker' in navigator` ensures we don't break on browsers that don't support service workers (very rare now).
- During development, the registration will happen and you'll see logs in the browser console.
- The registered service worker persists across page reloads (it's a browser-managed resource).

---

### Task 4: Test service worker registration

**What to do:**
1. Start the frontend: `cd app/frontend && npm run dev -- --port 5173`
2. Open browser DevTools (F12)
3. Go to the **Application** tab (Chrome/Edge) or **Storage** tab (Firefox)
4. Look for **Service Workers** in the left sidebar
5. Confirm you see an entry for `http://localhost:5173` with status `activated and running`
6. Refresh the page; the service worker should persist and show as active
7. In the **Console** tab, confirm you see the log message: `"Service Worker registered: [RegistrationObject]"`

**Troubleshooting:**
- If you see "Service Worker registration failed," check the browser console for the error
- Common issue: service-worker.js has a syntax error; check `http://localhost:5173/service-worker.js` in the browser to see the raw file
- HTTPS check: service workers require HTTPS in production, but http://localhost works for development

---

### Task 5: Add a manual push notification test helper (optional but recommended)

**File path:** `app/frontend/src/setupTests.ts` (if testing) OR add a debug utility

**What to do:**
This is not required for production but makes manual testing easier. Add a browser DevTools snippet to simulate a push event.

**In browser console, after service worker is registered:**
```javascript
// Simulate a push event (requires the service worker to be registered)
navigator.serviceWorker.ready.then((registration) => {
  const eventData = {
    title: 'Test Alert',
    body: 'This is a test notification from the browser console.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    record: {
      type: 'INCIDENT',
      id: 'INC-20260825-001',
    },
  };
  
  // Simulate a push event (this will trigger the service worker's push handler)
  registration.active.postMessage({
    type: 'PUSH_SIMULATION',
    payload: eventData,
  });
});
```

**Note:** This is a manual DevTools snippet, not part of the code. It won't be deployed; it's purely for testing. In a real scenario, push events come from the backend's push notification service (e.g., Firebase Cloud Messaging, Pushpin, or a custom service).

---

### Task 6: Integration test – simulate backend push

**What to do:**
- Assume the backend has a `/api/notifications/send` endpoint or similar that accepts a subscription and a payload
- From the backend (or curl), send a push event to a registered subscription
- Confirm the notification appears in the browser

**Backend flow (conceptual, not in this plan):**
1. Frontend requests notification permission: `Notification.requestPermission()`
2. Frontend gets a push subscription: `serviceWorkerRegistration.pushManager.subscribe(...)`
3. Frontend sends subscription to backend: `POST /api/subscriptions` with subscription details
4. Backend stores subscription, sends push event when needed: `subscription.endpoint` receives POST with encrypted payload
5. Browser receives push event → service worker's `push` event fires → notification displays

**For manual testing without a full backend push setup:**
- Use an online push service tester (e.g., web-push libraries in Node.js)
- Or use browser DevTools to manually trigger the service worker's `push` event (see Task 5)

---

### Task 7: Verify bundle size (optional)

**What to do:**
1. Build the frontend: `cd app/frontend && npm run build`
2. Confirm `dist/service-worker.js` exists and is a few KB (should be ~1–2 KB for the code above)
3. Confirm `dist/index.html` includes the main app bundle
4. No new dependencies were added, so bundle size should not increase

---

### Task 8: Manual end-to-end verification

**What to do:**
1. **Register the service worker** (Task 3 + 4): confirm DevTools shows it as "activated and running"
2. **Test notification display** (Tasks 1 + 5): use the console snippet to simulate a push event, confirm a notification appears in the browser (or OS notification center on desktop)
3. **Test notification click** (Task 1): click the notification, confirm:
   - The notification closes
   - The browser focuses an existing tab with that record (if one is open) OR opens a new tab to the record
4. **Test fallback** (Task 1): if `record` is missing from the notification, clicking should navigate to `/` (home page)
5. **Reload and verify persistence** (Task 3 + 4): reload the page, confirm the service worker is still registered and active (persists across reloads)

**Expected outcomes:**
- Notifications display with title, body, icon, and badge
- Clicking a notification with a record ID navigates to that record
- Clicking a notification without record data navigates to home
- Service worker survives page reloads

---

### Task 9: Commit and document

**What to do:**
1. Stage changes:
   - `app/frontend/public/service-worker.js` (new)
   - `app/frontend/src/main.tsx` (modified)
   - `app/frontend/vite.config.ts` (modified)

2. Commit with message:
   ```
   Add service worker registration & push notification handling
   
   - Create public/service-worker.js with push event listener
   - Display structured notifications (title, body, icon, badge)
   - Handle notification clicks to focus/open record in existing tab
   - Register service worker in main.tsx on app startup
   - Vite config already serves public files at root (no change needed)
   
   Assumes backend has push notification endpoint to send payloads to
   registered subscriptions.
   ```

3. Push to remote (if applicable)

---

## Next Steps (Future Features)

These are **out of scope** for this plan but depend on the service worker being in place:

1. **Notification permission UI**: Add a button in Settings or AppShell to request user permission and subscribe to push events
2. **Subscription storage backend**: Create `/api/subscriptions` endpoint to store user push subscriptions
3. **Backend push scheduler**: Send push notifications from the backend based on alert logic (overdue reviews, due-soon dates, etc.)
4. **Email fallback**: If user denies notification permission, send email digest instead
5. **Unsubscribe flow**: Allow users to opt out of push notifications per type or globally

---

## Verification Checklist

- [ ] `app/frontend/public/service-worker.js` created with push and notificationclick handlers
- [ ] `app/frontend/vite.config.ts` has `publicDir: 'public'` (or left as default)
- [ ] `app/frontend/src/main.tsx` registers service worker on startup with try/catch
- [ ] DevTools shows service worker as "activated and running" after `npm run dev`
- [ ] Console shows registration success log message
- [ ] Manual console test (Task 5) simulates a push notification successfully
- [ ] Notification displays with correct title, body, icon, badge from payload
- [ ] Clicking notification focuses existing tab or opens new tab to record URL
- [ ] Service worker persists across page reloads
- [ ] No TypeScript or linting errors in modified files
- [ ] `npm run build` completes without errors; dist includes service-worker.js
