# Dashboard Feature Gap Map

Cross-file synthesis of the 3 tsx prototype reviews against QA-Brain's current Dataview dashboards. See [[QA-Brain - Dashboards]] for what exists today.

## Features mapped to QA-Brain gaps

| Feature | Source | Fills gap |
|---|---|---|
| Free-text-to-frontmatter extraction | Cognitive Compiler | LLM-assisted draft of INCIDENT/CAP frontmatter from raw notes -- current vault requires manual Templater fill |
| Required-field validation warnings | Cognitive Compiler | Catches missing frontmatter before save -- CLAUDE.md flags typos silently break Dataview |
| Record-type segmented picker | Cognitive Compiler | UI pattern for a "new record" intake screen |
| Relationship graph (repointed at real links) | Cognitive Compiler | Visualizes SOP<->INCIDENT<->CAP model instead of Obsidian's generic graph view |
| Schema-as-data blueprints | Engine Registry Sandbox | Strongest architectural fit -- echoes the vault's own per-type Templater schema |
| Status-lifecycle pill cards | Engine Registry Sandbox | Richer status display than flat Dataview table rows |
| Append-only audit log panel | Engine Registry Sandbox | Maps to "Obsidian Git = audit trail" convention |
| Training quiz/competency tracking | Engine Registry Sandbox | Maps to TRAINING record type, "incomplete training" dashboard |
| Click-node-see-detail pattern | Multimodal Workspace Compiler | Alternate relationship-visualization interaction |
| Markdown-to-styled-blocks renderer | Multimodal Workspace Compiler | Reusable for rendering any generated report |

## Gaps -- no candidate file addresses these

- **None of the 3 files replicate the actual current Dataview dashboard queries** (open CAPs, SOPs pending review <=30d, recent changes, incomplete training, upcoming audits, root-cause trend grouping, effectiveness-check-due, audit findings traceability). All 3 subagent reviews independently flagged this.
- **None show a real read/write-to-Markdown-frontmatter strategy.** All 3 are in-memory mock data with zero persistence -- the actual hard problem (how a React app would read/write the vault's `.md` files) is unaddressed by any candidate.
- **No charting library appears in any of the 3 files**, despite two of them (Engine Registry Sandbox, and implicitly Cognitive Compiler) implying trend/chart functionality in their copy. Root-cause trend grouping and effectiveness tracking -- both real current dashboard features -- have no reusable chart component to draw from here.

## Open questions surfaced by the 3 sub-agent reviews (unresolved -- flagging, not deciding)

1. **None of the 3 files are dashboards in the "record status overview" sense** -- they're an intake compiler, a lab EQMS console demo, and an unrelated product pitch. Should they be evaluated on a different axis ("best intake UX", "best interaction patterns to salvage") instead of "best dashboard replacement"?
2. **Gemini Multimodal Workspace Compiler may be miscategorized** -- reviewer found ~90% of its content domain-irrelevant (Google Photos/Video/Keep ingestion), with only 2 small UI patterns salvageable. Confirm this file belongs in the evaluation set at all.
3. **Engine Registry Sandbox's filename doesn't match its content** (a lab EQMS demo, not a generic "engine registry") -- worth confirming this is the file you intended, not a mislabeled artifact.
4. **The persistence question is unaddressed everywhere**: before picking a direction, decide whether a rebuilt dashboard would read live Obsidian vault files, a synced export, or something else -- none of the 3 prototypes model this.
5. **Schema-as-data (blueprints) is a bigger investment than a UI reskin** -- is a dynamic form-builder actually wanted, or would a simpler static dashboard replicating current Dataview tables with nicer UI satisfy the "more robust than Obsidian" goal from your Q9 answer?

## Related

- [[EQMS Cognitive Compiler Dashboard]]
- [[EQMS Engine Registry Sandbox]]
- [[Gemini Multimodal Workspace Compiler]]
- [[QA-Brain - Dashboards]]
