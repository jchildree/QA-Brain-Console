# In-App Alerts: Overview Panel + Nav Badges

**Wave:** 12 (after Wave 11; before push-subscription-management, Wave 13, and persistent-chat-panel, Wave 14, which also touch AppShell.tsx/api/client.ts)
**Consumes:** `GET /api/alerts` (Wave 7, alert-engine-backend-api) -- DO NOT recreate routes/alerts.js or re-edit its index.js mount, call the existing route only
**Produces:** Overview alert panel; nav badge counts; `useAlerts` hook
**Owns exclusively:** app/frontend/src/api/client.ts (fetchAlerts), app/frontend/src/hooks/useAlerts.ts, app/frontend/src/pages/Overview.tsx, app/frontend/src/components/AppShell.tsx (badge markup only), index.css

> **For agentic workers:** Execute this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface alert status (overdue reviews, due-soon) at two entry points: (1) replace the flat count in `Overview.tsx`'s "Drawers Requiring Attention" panel (lines 286–304) with a clickable alert-list panel similar to `RecordCard` layout, and (2) add per-type badge counts to the navigation tabs in `AppShell.tsx` (lines 5–52) showing overdue/due-soon counts.

**Scope:**
- Backend alert endpoint `/api/alerts` that computes overdue/due-soon status per record type and returns structured alert metadata.
- Frontend hook to consume alerts endpoint and cache results.
- Override the hardcoded `overdue` count and `draftOrReview` count in `Overview.tsx` with rich alert rows, each linking to `/{type}/{filename}`.
- Add badge mechanism to nav tabs in `AppShell.tsx` to display per-type alert counts.
- **No push or email in this plan** – display only.

**Non-goals:** Configurable "due soon" threshold (hardcode to 14 days); admin-only alert filtering; mobile-optimized badge layout.

**Tech Stack:** No new dependencies. Reuse existing `RecordSummary`, `isOverdue()` logic, and `RecordCard` styling patterns.

---

## Before you start

Both servers run locally side by side:
- Backend: `cd app/backend && npm run start` (port 4000)
- Frontend: `cd app/frontend && npm run dev -- --port 5173`

Key files you'll touch:
- Backend: `app/backend/src/index.js` (register route), new route file `app/backend/src/routes/alerts.js`
- Frontend API: `app/frontend/src/api/client.ts` (add alerts fetch)
- Frontend pages: `app/frontend/src/pages/Overview.tsx` (replace hardcoded counts), `app/frontend/src/components/AppShell.tsx` (add badge render)

Existing utility to reuse:
- `app/frontend/src/components/RecordDashboard.tsx`: `isOverdue()` at line 11
- `app/frontend/src/components/RecordCard.tsx`: card layout/styling pattern for alert rows

---

### Task 1: Backend alerts route – compute overdue/due-soon per type

- [ ] Create `app/backend/src/routes/alerts.js`:
  - Export `createAlertsRouter()` following the pattern of `createRecordsRouter()` in `app/backend/src/routes/records.js`.
  - Route: `GET /alerts` returns array of alert summaries per record type.
  - Logic:
    - Loop over `RECORD_TYPES` (passed as argument, see `index.js` for pattern).
    - For each type, `listSops(dir)` to fetch all records (reuse existing vault.js).
    - Filter to:
      - **Overdue**: `record.status === 'Approved' && new Date(record.review_date) < new Date()`
      - **Due soon**: `record.status === 'Approved' && days until review_date ≤ 14` (hardcoded threshold)
    - Return: `{ type: string; urlSlug: string; overdue: number; dueSoon: number }[]`
    - Empty counts (0 overdue, 0 due soon) still appear in response – no filtering.
  - Protect route with `requireAuth` like other routes.

- [ ] Wire the new route into `app/backend/src/index.js`:
  - After line 85 (trash router setup), add:
    ```javascript
    app.use('/api/alerts', requireAuth);
    app.use('/api', createAlertsRouter(RECORD_TYPES));
    ```
  - Import `createAlertsRouter` from `./routes/alerts` at the top.

- [ ] Verify response shape at `http://localhost:4000/api/alerts` (browser or curl, requires login session).

### Task 2: Frontend alerts API hook

- [ ] In `app/frontend/src/api/client.ts`, add a new export:
  ```typescript
  export async function fetchAlerts(): Promise<Array<{ type: string; urlSlug: string; overdue: number; dueSoon: number }>> {
    const res = await fetch(`${BASE_URL}/alerts`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load alerts');
    return res.json();
  }
  ```

- [ ] (Optional but recommended) Add a `useAlerts()` hook in `app/frontend/src/hooks/useAlerts.ts` (create if missing):
  ```typescript
  import { useEffect, useState } from 'react';
  import { fetchAlerts } from '../api/client';
  
  export function useAlerts() {
    const [alerts, setAlerts] = useState<Array<{ type: string; urlSlug: string; overdue: number; dueSoon: number }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      fetchAlerts()
        .then(setAlerts)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, []);
  
    return { alerts, loading, error };
  }
  ```

### Task 3: Update Overview.tsx – replace hardcoded panel with alert list

- [ ] Import `useAlerts` (or call `fetchAlerts` directly if you skip Task 2's hook).

- [ ] In `Overview()` function, remove/replace lines 286–304:
  - Old code renders static text "Overdue reviews" with count and "Draft / in review" with count.
  - New code:
    - Call `useAlerts()` to get alerts by type.
    - Build two sub-panels: one for overdue, one for due-soon (or combine into one scrollable list).
    - For each alert in the list, render a clickable row (similar to `RecordCard`) showing:
      - Record `id` (e.g., `SOP-20260807-001`)
      - Record type label
      - Review date
      - Link to `/{type}/{filename}` (fetch full record details if needed to get filename, or pass through in alert response)
    - If neither overdue nor due-soon alerts exist, show a "No overdue or due-soon reviews" message.

- [ ] **Extend alert response** (back to Task 1 / alerts.js):
  - Include `filename` in each alert object so Overview doesn't have to do a second fetch.
  - Return: `{ type: string; urlSlug: string; records: Array<{ id: string; filename: string; review_date: string; status: string }> }[]`
  - Keep the summary counts (overdue: number, dueSoon: number) alongside the detailed records array.

- [ ] Update `useAlerts()` return type and `fetchAlerts()` signature to match new shape.

### Task 4: Add nav badge rendering to AppShell.tsx

- [ ] Import `useAlerts` into `AppShell.tsx`.

- [ ] In `AppShell()` function, call `useAlerts()` to get per-type alert counts.

- [ ] Modify the nav render loop (lines 41–52):
  - For each `link` in `navLinks`, if the link is to a record-type tab (e.g., `/sop`, `/cap`, etc.):
    - Look up the alert count for that type from the `alerts` array (type matching).
    - Render a small badge (e.g., `<span className="nav-badge">{count}</span>`) next to the tab label if count > 0.
    - Show total of overdue + dueSoon for that type on the badge.

- [ ] Badge styling (add to existing stylesheet, e.g., `app/frontend/src/index.css`):
  - Small circular or pill-shaped badge, top-right corner of tab label.
  - Color: red/orange for overdue-only, yellow for due-soon-only, red if both present.
  - Font size smaller than tab label, e.g., 11–12px.
  - Example CSS:
    ```css
    .nav-badge {
      display: inline-block;
      background: var(--red);
      color: white;
      border-radius: 12px;
      padding: 2px 6px;
      font-size: 11px;
      margin-left: 4px;
      font-weight: bold;
    }
    ```

### Task 5: Detailed wiring for clickable alert rows (Overview.tsx)

- [ ] In Overview.tsx's "Drawers Requiring Attention" panel, replace the static count structure:
  - Old: `<div className="drawer-item"><span>Overdue reviews</span><span className="drawer-count">{overdue.length}</span></div>`
  - New: For each alert type with overdue > 0, render a clickable row:
    ```tsx
    {alerts
      .filter(alert => alert.overdue > 0 || alert.dueSoon > 0)
      .map(alert =>
        alert.records
          .filter(r => (isOverdue(r) && alert.overdue > 0) || (isDueSoon(r) && alert.dueSoon > 0))
          .map(record => (
            <Link key={`${alert.type}-${record.filename}`} to={`/${alert.urlSlug}/${record.filename}`}>
              <div className="alert-row">
                <span>{record.id}</span>
                <span>{new Date(record.review_date).toLocaleDateString()}</span>
                <span className="alert-type-badge">{alert.type.toUpperCase()}</span>
              </div>
            </Link>
          ))
      )}
    ```

- [ ] Add `isDueSoon()` helper (similar to `isOverdue()`) in `RecordDashboard.tsx` or inline in Overview:
  ```typescript
  function isDueSoon(record: RecordSummary): boolean {
    if (record.status !== 'Approved') return false;
    const now = new Date();
    const reviewDate = new Date(record.review_date);
    const daysUntil = (reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysUntil > 0 && daysUntil <= 14;
  }
  ```

- [ ] Style the alert row to match `RecordCard` (clickable, hover effect, card-like appearance).

### Task 6: Manual verification

- [ ] Backend running (`npm run start` in `app/backend`), frontend running (`npm run dev` in `app/frontend`).

- [ ] Approve an existing record and backdate its `review_date` to today or earlier; confirm it shows in the alert list on Overview.

- [ ] Approve a second record with `review_date` 7 days from today; confirm it shows as "due soon" (if due-soon rendering is separate from overdue).

- [ ] On AppShell nav tabs, confirm badge appears for the type(s) with alerts; badge color/count updates when alert status changes.

- [ ] Click an alert row on Overview; confirm navigation to `/{type}/{filename}` works and record loads correctly.

- [ ] Create a new record type with no overdue/due-soon; confirm its tab has no badge and panel shows "No alerts" state.

- [ ] Run test suites (`npm run test` in both `app/backend` and `app/frontend`); no regressions.

### Task 7: Cleanup & refinement

- [ ] If `useAlerts()` hook was created, consider adding error handling (display error toast if alerts fail to load, fall back to empty array).

- [ ] Consider caching the alerts result at the Overview/AppShell level to avoid re-fetching on every component re-render (e.g., with a 1–5 minute cache or update-on-save).

- [ ] Confirm nav badge visibility on mobile (consider hiding if space is too tight, or use tooltip).

---

## Summary of changes

| File | Change | Purpose |
|------|--------|---------|
| `app/backend/src/routes/alerts.js` | **NEW** | Compute overdue/due-soon per type, return alert metadata |
| `app/backend/src/index.js` | Add route import & middleware | Register alerts endpoint |
| `app/frontend/src/api/client.ts` | Add `fetchAlerts()` export | API call to alerts endpoint |
| `app/frontend/src/hooks/useAlerts.ts` | **NEW** (optional) | React hook to consume alerts |
| `app/frontend/src/pages/Overview.tsx` | Replace lines 286–304 | Render clickable alert rows instead of static count |
| `app/frontend/src/components/AppShell.tsx` | Update nav render loop | Add badge display to record-type tabs |
| `app/frontend/src/index.css` | Add `.nav-badge` styles | Badge appearance |
