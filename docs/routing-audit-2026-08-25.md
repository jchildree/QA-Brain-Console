# Routing Audit -- 2026-08-25

Source plan: `docs/superpowers/plans/2026-08-25-orphaned-pages-routing-gaps-audit.md`
Scope: `app/frontend/src/App.tsx`, `app/frontend/src/components/AuthGate.tsx`, `app/frontend/src/pages/*`

## Result: No gaps found. Report-only, no code changes.

## Summary table

| Category | Count | Notes |
|---|---|---|
| Total page files on disk (excl. `.test.tsx`) | 31 | verified via directory listing |
| Routed in App.tsx `<Routes>` | 29 | matches plan expectation |
| Unrouted, rendered by AuthGate | 2 | LoginPage, SetupPasswordPage |
| Record-type Dashboard/Editor/Intake triples | 8 x 3 = 24 | SOP, CAP, INCIDENT, CHANGE, AUDIT, TRAINING, MEETING, NOTES -- all complete |
| Utility pages routed | 5 | Overview, AdminUsersPage, SettingsPage, EvidenceLibraryPage, TrashPage |
| Duplicate route paths | 0 | `grep 'path="/' App.tsx \| grep -oE '"/[^"]*"' \| sort \| uniq -d` returns empty |
| Missing Editor wrappers | 0 | all 8 `*EditorRoute` wrappers present, each guards on `:filename` and returns `null` if absent |
| Import/export mismatches | 0 | every imported component in App.tsx has a matching `export function` in its source file |

## Task-by-task findings

1. **Routed pages have component files** -- all 29 imports in App.tsx resolve to existing files in `app/frontend/src/pages/`; no typos found.
2. **Unrouted pages are intentional** -- only `LoginPage.tsx` and `SetupPasswordPage.tsx` are unrouted. Both are rendered directly by `AuthGate.tsx`:
   - `LoginPage` renders when session status is `unauthed`.
   - `SetupPasswordPage` renders when `location.pathname === '/setup'`, checked before the authed/unauthed branch so it's reachable pre-auth. This means `/setup` is a real, working URL that does **not** appear in App.tsx's `<Routes>` list -- worth calling out since a naive "grep App.tsx for routes" pass would miss it. Documented in CLAUDE.md.
3. **Triple completeness** -- the plan's "Current State" section describes a pre-Wave-2 layout (generic `Dashboard.tsx`/`Intake.tsx` for SOP). That has since been renamed: current files are `SopDashboard.tsx`, `SopEditor.tsx`, `SopIntake.tsx`, matching the other 7 types' naming exactly. No generic-named files remain. All 8 types have complete triples (24 components, all exported and routed).
4. **No duplicate/conflicting routes** -- verification command returned empty (no dupes). All literal paths (e.g. `/sop/new`) are declared before their parameterized sibling (`/sop/:filename`) for every record type; React Router also matches by specificity regardless of order, so this is a style consistency, not a bug-avoidance requirement.
5. **Editor route wrappers** -- all 8 (`SopEditorRoute`, `CapEditorRoute`, `IncidentEditorRoute`, `ChangeEditorRoute`, `AuditEditorRoute`, `TrainingEditorRoute`, `MeetingEditorRoute`, `NoteEditorRoute`) are defined, each reads `:filename` via `useParams` and returns `null` when absent, then passes `filename` to the corresponding Editor component.
6. **CLAUDE.md documentation** -- no prior "Routing & Pages" section existed. Added one (see below).
7. **No import/export errors** -- every component imported in App.tsx is exported from its source file (`export function ComponentName`); AuthGate correctly imports `LoginPage` and `SetupPasswordPage`.
8. **Spot checks (static/code-level, no dev server run)** -- traced route-to-component mapping in App.tsx for `/`, `/sop`, `/cap/new`, `/admin/users`; all resolve to the expected component per the Routes table. `/invalidpath` has no matching `<Route>` and no catch-all/`*` route is defined, so React Router renders nothing for unmatched paths inside `<AppShell>` rather than a dedicated 404 page or redirect -- this is a minor UX gap (silent blank content area) but out of this audit's declared scope (report-only, no gaps that require code changes were identified in the plan's checklist items 1-7). Flagging here for awareness rather than fixing, since adding a 404 route/redirect is a product decision, not a routing-completeness bug. Pre-auth redirect behavior is enforced by `AuthGate` itself (renders `LoginPage` in place of `children`/routes when unauthed), not by per-route guards, so logged-out users cannot reach `/settings`, `/admin/users`, etc. by design.

## Remediation

None required -- no gaps found against the plan's checklist.

## CLAUDE.md update

Added a "Frontend routing & pages" section documenting the AuthGate-rendered pages, the `/setup` pseudo-route, and the completed Dashboard/Editor/Intake triple naming. See `CLAUDE.md`.
