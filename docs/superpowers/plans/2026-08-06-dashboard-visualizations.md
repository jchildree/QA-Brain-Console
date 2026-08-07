# Dashboard Data Visualization Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overview today has exactly one chart (`StripChart`, a 14-day cumulative-count line trace, `app/frontend/src/pages/Overview.tsx` + `app/frontend/src/components/StripChart.tsx`) plus flat rail counts. Status lifecycle (`Draft/In Review/Approved/Obsolete`), CAP effectiveness (`effectiveness_status: Pending/Pass/Fail/N/A`), cross-record links (`related_documents`), and incident causes have zero dedicated visualization despite being the fields QA actually cares about. This plan closes that gap, locked via `the-question:interrogate-spec` on 2026-08-06.

**Scope locked by interrogation:**

1. **Per-type status donut rings** on Overview -- one donut per record type (7 total), arcs colored by status, not stacked bars.
2. **CAP effectiveness funnel** (Pending → Pass/Fail/N/A) -- shown on both `CapDashboard.tsx` (full funnel) and Overview (summary readout tile).
3. **Per-record local relationship graph** (phase 1) -- every record editor/detail page (Sop/Cap/Incident/Change/Audit/Training/Meeting Editor) shows the current record + 1-hop `related_documents` links as a small graph, via `react-flow`.
4. **Global force-graph** (phase 2, fixed follow-up, not deferred-on-data-volume) -- Overview-level, all records as nodes across all 7 types, edges from `related_documents`, via `react-flow`.
5. **Incident severity + root-cause Pareto, and trend-over-time** on `Incident-Trends`-equivalent (`IncidentDashboard.tsx`) -- requires two new schema fields first (see Task 1).
6. **Charting library**: adopt Recharts (or visx -- pick one at implementation time, do not mix) for the new donut/funnel/Pareto charts. `StripChart` stays hand-rolled SVG as-is; do not migrate it.
7. **New sibling components**, not one generic switch-on-`kind` component: `DonutChart.tsx`, `FunnelChart.tsx`, `ParetoChart.tsx` next to `StripChart.tsx`.

**Non-goals for this pass:** Migrating `StripChart` to the new library. Any change to `Audit-Prep`/`SOP-Control`-equivalent dashboards beyond the generic status donut they inherit for free once `RecordDashboard` grows the shared donut. Search, Evidence Library, Settings, auth -- untouched.

**Tech Stack additions:** `recharts` (or `visx` -- decide at Task 3, record the choice in the task's own notes) and `react-flow` (`@xyflow/react`) added to `app/frontend/package.json`. No backend dependency changes.

---

## Before you start

Both servers run locally side by side:
- Backend: `cd app/backend && npm run start` (port 4000)
- Frontend: `cd app/frontend && npm run dev -- --port 5173`

---

### Task 1: Add `severity` and `root_cause` fields to Incident schema

- [ ] Add `severity` (`select`: `Low, Medium, High, Critical`) and `root_cause` (`text` or `select` -- decide based on whether a controlled vocabulary is wanted; default to `text` to avoid inventing an unrequested taxonomy) to `app/frontend/src/blueprint/incidentBlueprint.ts`.
- [ ] Add the same two fields to `qa-brain/_templates/INCIDENT.md` frontmatter, matching existing field style.
- [ ] Update `app/backend/src/fieldSchemas.js` incident entry so AI extraction (`anthropicProvider.js`/`customProvider.js`) can populate `severity`/`root_cause` from raw intake text.
- [ ] Existing incident records without these fields must not break `IncidentDashboard`/`IncidentEditor` -- treat missing value as `undefined`/"Unclassified" bucket in the Pareto, not a crash.

### Task 2: `DonutChart` component + per-type status donuts on Overview

- [ ] Add charting library to `app/frontend/package.json` (Task 3 decides which; do this task after or alongside Task 3).
- [ ] Build `app/frontend/src/components/DonutChart.tsx`: props `{ title, data: { label: string; value: number; colorVar: string }[] }`, styled consistent with `--rule`/CSS custom-property color scheme used elsewhere (see `StripChart.tsx` for the `col()` pattern).
- [ ] In `Overview.tsx`, add a donut-ring row: one `DonutChart` per `RECORD_TYPES` entry, arcs = count of records in each of the 4 status values, colors mapped per status (not per type -- type is already conveyed by which donut it is).
- [ ] Same status-donut logic should be reusable from `RecordDashboard.tsx` so per-type dashboards (Sop/Change/Audit/Training/Meeting) get it too without bespoke code -- extract a `statusBreakdown(records)` helper next to `dailyCumulativeCounts` in `app/frontend/src/api/chartData.ts`.

### Task 3: Pick and install charting library, build `FunnelChart` + `ParetoChart`

- [ ] Decide Recharts vs visx (record the decision as a one-line note in this task when checking it off) and add to `app/frontend/package.json`.
- [ ] Build `app/frontend/src/components/FunnelChart.tsx`: stages `Pending -> Pass/Fail/N-A`, counts from `effectiveness_status` across CAP records.
- [ ] Build `app/frontend/src/components/ParetoChart.tsx`: generic bar-plus-cumulative-line Pareto, reusable for incident `root_cause` counts (and severity distribution as a second call).

### Task 4: CAP effectiveness funnel wiring

- [ ] `CapDashboard.tsx`: add full `FunnelChart` above the existing table, fed by CAP records' `effectiveness_status`.
- [ ] `Overview.tsx`: add a small summary readout tile (not the full funnel) showing Pending/Pass/Fail counts, matching the existing `readouts` tile style used by `StripChart`.

### Task 5: Incident severity/root-cause Pareto + trend

- [ ] `IncidentDashboard.tsx`: add `ParetoChart` for `root_cause` (bar = count per cause, sorted descending, cumulative % line) and a second breakdown for `severity`.
- [ ] Add a trend-over-time line (reuse `StripChart` + a new `dailyCumulativeCounts`-style bucketing function keyed by `severity`, e.g. `dailySeverityTrend` in `chartData.ts`) so severity mix over time is visible, not just a snapshot Pareto.
- [ ] Records missing `severity`/`root_cause` (pre-Task-1 data) bucket into "Unclassified" rather than being dropped silently.

### Task 6: Per-record local relationship graph (`react-flow`, phase 1)

- [ ] Add `@xyflow/react` to `app/frontend/package.json`.
- [ ] Build `app/frontend/src/components/RelatedRecordsGraph.tsx`: takes the current record + its `related_documents` (already fetched via `app/frontend/src/api/relatedRecords.ts` -- check this file's current shape before assuming it returns full records vs IDs only) and renders center node + 1-hop neighbor nodes, edges labeled/colored by type via existing `colorVar` per `RECORD_TYPES`.
- [ ] Wire into all 7 editor pages (`SopEditor.tsx`, `CapEditor.tsx`, `IncidentEditor.tsx`, `ChangeEditor.tsx`, `AuditEditor.tsx`, `TrainingEditor.tsx`, `MeetingEditor.tsx`) -- same component, same props shape, each just passes its own record + related list.
- [ ] Empty state (no related_documents) renders "No linked records" rather than an empty canvas.

### Task 7: Global force-graph on Overview (phase 2, fixed scope -- not conditional on data volume)

- [ ] Extend `RelatedRecordsGraph` or build a sibling `VaultGraph.tsx` (decide based on how much phase-1 code actually reuses -- if the local graph's layout logic is trivial, a separate component is fine per the "new sibling components" decision in this plan's header) that takes **all** records across all 7 types plus notes, renders as one `react-flow` canvas, nodes colored by type.
- [ ] Add to `Overview.tsx` below the status donuts / strip chart -- collapsed/expandable panel so it doesn't dominate the page on first load, given it'll render a lot of nodes even at low link density.
- [ ] Orphan nodes (no `related_documents` in or out) should be visually distinguishable (e.g. dimmed, or filterable toggle) rather than cluttering the graph undifferentiated from connected nodes.

### Task 8: Manual verification

- [ ] `cd app/frontend && npm run dev -- --port 5173`, backend running alongside.
- [ ] Overview: confirm 7 status donuts render, CAP funnel readout tile shows correct Pending/Pass/Fail counts, strip chart still works unchanged.
- [ ] Create/edit an Incident record with a `severity` and `root_cause` value set; confirm it shows up in the Pareto and trend chart on `IncidentDashboard`.
- [ ] Open any record editor with at least one `related_documents` entry; confirm the local relationship graph renders the link.
- [ ] Expand the global force-graph panel on Overview; confirm it renders without crashing at current (likely low) vault record volume.
- [ ] Run existing test suites (`npm run test` in `app/frontend` and `app/backend`) -- no regressions from schema/field additions.
