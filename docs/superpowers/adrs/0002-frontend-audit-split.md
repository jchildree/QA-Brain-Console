# ADR-0002: Frontend Audit Split by Concern, Not by File

## Status
Accepted

## Context

Frontend audit spans ~90 files. A single audit pass would blow past one
execution session and mix unrelated verification strategies.

## Decision

Split into three independent audit fronts, each with its own leaf plans:
blueprint/schema consistency (blueprints vs `fieldSchemas.js` vs
`RecordEditor`), routing/nav hygiene (route defs, wrapper instantiation,
orphaned pages, nav/API consistency), and component-level edge cases
(cards, related-records graph, error/loading states). No leftover ADR-002
"coming soon" stubs were found -- that concern dropped out entirely.

## Consequences

Audit findings across the three fronts can land in parallel (disjoint
files) except where a fix in blueprint/schema touches `RecordEditor.tsx`,
which routing/nav plans also touch -- flagged as a seam for wave planning.
