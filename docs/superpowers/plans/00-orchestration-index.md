# Orchestration Index -- QA Brain "Jarvis" Console

Source: `docs/superpowers/adrs/0001-project-scope.md` through `0004-alerts-architecture.md`.
26 leaf plans, 15 waves, 2 phases. Phase A (Stabilization, Waves 1-6) must
fully complete before Phase B (Jarvis, Waves 7-15) begins executing, per
ADR-0001.

## Collision rule (binding, verbatim)

> Before editing any file, run `git status <path>` and `git log -1 <path>` to
> confirm no other plan's agent has an in-flight or uncommitted change to it.
> On collision, stop and report rather than editing.

## Budget bands (starting calibration -- adjust after Wave 1 executes)

Same as `parallel-wave-planning` defaults: 4-8 tasks, 15-25 steps, 6-10 files
touched, 1-3 full test runs, 1-4 new external surfaces per plan. Several
audit-only plans in Wave 3 are intentionally light (report-only, 0 new
surfaces) -- that's expected, not a sizing miss.

## Phase A -- Stabilization

### Wave 1 (parallel, disjoint files)
| # | Plan | Owns |
|---|------|------|
| 1 | backend-audit-stabilization | routes/records.js, routes/attachments.js |
| 2 | vault-dashboard-audit | qa-brain/_dashboards/*, qa-brain/_templates/* |
| 3 | card-component-rendering-edge-cases | RecordCard.tsx, NoteCard.tsx |
| 4 | audit-relatedRecords-test-coverage | relatedRecords.test.ts |

### Wave 2 (parallel, disjoint files)
| # | Plan | Owns |
|---|------|------|
| 5 | blueprint-coverage-naming-audit | App.tsx, Dashboard.tsx→SopDashboard.tsx, Intake.tsx→SopIntake.tsx |
| 6 | blueprint-backend-consistency-audit | incidentBlueprint.ts, changeBlueprint.ts, notesBlueprint.ts, RecordEditor.tsx (validation) |

### Wave 3 (parallel; audits over Wave 1+2 output -- mostly report-only, coordinate on shared test files)
| # | Plan |
|---|------|
| 7 | audit-RecordEditor-RecordIntake-mergeRelated-integration |
| 8 | error-loading-ux-audit |
| 9 | nav-and-api-endpoint-audit |
| 10 | orphaned-pages-routing-gaps-audit |
| 11 | navigation-flow-verification |
| 12 | route-import-audit |
| 13 | wrapper-component-instantiation-audit |

### Wave 4 (alone)
| # | Plan | Produces |
|---|------|----------|
| 14 | related-records-graph-resilience | RelatedRecordsGraph.test.tsx (creates it) |

### Wave 5 (alone, appends to Wave 4's test file)
| # | Plan | Consumes |
|---|------|----------|
| 15 | audit-related-records-null-handling | RelatedRecordsGraph.test.tsx (Plan 14) |

### Wave 6 (alone -- stabilization close-out, blocks all of Phase B)
| # | Plan |
|---|------|
| 16 | deploy-stabilization |

## Phase B -- Jarvis (starts only after Wave 6 commits)

### Wave 7 (alone)
| # | Plan | Produces |
|---|------|----------|
| 17 | alert-engine-backend-api | `GET /api/alerts`, index.js mount |

### Wave 8 (parallel, disjoint files)
| # | Plan | Produces |
|---|------|----------|
| 18 | backend-chat-endpoint-provider-methods | `POST /api/chat`, provider.chat(), index.js mount |
| 19 | smarter-automation-auto-link-tag-fill | auto-link/tag/fill in RecordIntake/RecordEditor/NoteEditor |

### Wave 9 (alone)
| # | Plan | Consumes |
|---|------|----------|
| 20 | scoped-chat-draft-capability | `POST /api/chat` (Plan 18) |

### Wave 10 (alone)
| # | Plan | Produces |
|---|------|----------|
| 21 | backend-vapid-web-push-send | `POST /api/push/send`, index.js mount |

### Wave 11 (alone)
| # | Plan | Consumes |
|---|------|----------|
| 22 | frontend-service-worker-registration-and-push | `POST /api/push/send` (Plan 21) |

### Wave 12 (alone)
| # | Plan | Consumes |
|---|------|----------|
| 23 | in-app-alerts-overview-and-badges | `GET /api/alerts` (Plan 17) |

### Wave 13 (alone -- shares api/client.ts with Plan 23)
| # | Plan | Consumes |
|---|------|----------|
| 24 | push-subscription-management | Plan 21's push route + Plan 22's SW registration |

### Wave 14 (alone -- shares AppShell.tsx with Plans 23/24)
| # | Plan | Consumes |
|---|------|----------|
| 25 | persistent-chat-panel | `POST /api/chat` / provider.chat() (Plan 18) |

### Wave 15 (alone -- last index.js editor)
| # | Plan |
|---|------|
| 26 | email-delivery-smtp-digest |

## Seam map (adjacent-pair contracts, for `stitch`)

- 5↔6 (Wave 2): both edit disjoint files but both touch the SOP/record page family -- verify App.tsx routes still resolve to the renamed SOP pages after both land.
- Wave 2→3: Plans 7-13 all read RecordEditor.tsx/RecordIntake.tsx/App.tsx as fixed by Plans 5-6 -- verify no Wave 3 audit is auditing against pre-fix state.
- 7↔8 (Wave 3): both may add cases to RecordEditor.test.tsx/RecordIntake.test.tsx -- verify no case was silently overwritten.
- 14→15 (Wave 4→5): Plan 15 must append to RelatedRecordsGraph.test.tsx, not recreate it -- verify file still contains all 12 of Plan 14's suites after Plan 15 lands.
- Wave 6→7: Plan 16 (deploy) must be green before Plan 17 starts -- verify prod stack is actually up, not just composed.
- 17→23 (Wave 7→12): Plan 23 must call `GET /api/alerts`, not define its own route handler -- verify only one `routes/alerts.js` exists after Wave 12.
- 18→20 (Wave 8→9): Plan 20's middleware must wrap the route Plan 18 created -- verify `POST /api/chat` still 200s with an allowed scope after Plan 20 lands.
- 18→25 (Wave 8→14): Plan 25 must call the existing chat route/provider, not redefine `routes/chat.js` -- verify only one chat route handler exists after Wave 14.
- 21→22 (Wave 10→11): Plan 22's push handler must POST to the endpoint Plan 21 created -- verify a live push round-trips end to end.
- 21/22→24 (Wave 10/11→13): Plan 24 must not create a second `routes/push.js` send handler or a second service-worker file -- verify exactly one of each exists after Wave 13.
- 23→24→25 (Waves 12→13→14): all three edit `api/client.ts`/`AppShell.tsx` -- verify each wave's diff to those files is additive, not a revert of the prior wave's change.

## Deviation from ADR-0001/0002-0004 during Steps 3-4

Three of the 26 leaf plans, written independently by parallel decomposition
agents, each redefined a route/file another plan already owns (`routes/alerts.js`
+ `index.js` mount duplicated by Plan 23; `routes/chat.js` + `index.js` mount
duplicated by Plan 25; `routes/push.js` + `index.js` mount + a second service
worker file duplicated by Plan 24). Per `parallel-wave-planning` Step 3 ("two
plans both claim to produce the same artifact... fix it now"), each plan's
seam header now marks that duplication explicitly as **DO NOT recreate** and
redirects it to consume the real producer instead. The plan bodies below the
seam header still describe the original (duplicating) approach in places --
whoever executes Plans 23, 24, and 25 must follow the seam header's Consumes
line over the body text where they conflict.
