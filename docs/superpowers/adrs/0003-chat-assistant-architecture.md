# ADR-0003: Chat Assistant Split into Provider, Permission, and UI Layers

## Status
Accepted

## Context

Persistent chat assistant (ADR-0001) needs backend Claude-proxy plumbing,
draft-scope permissioning per user, and a mounted frontend panel. These
touch disjoint files and have independent failure modes (a provider bug is
not a UI bug).

## Decision

Three leaf plans: (1) backend chat endpoint + provider methods (stateless,
reuses existing vault/search logic, ~150 LOC route), (2) scoped
draft-write capability (allowlist middleware on POST + localStorage scope
picker, no new DB table, reuses existing admin/user roles per ADR-0001),
(3) persistent chat panel mounted in the frontend shell, reusing the
existing API client pattern.

## Consequences

(1) must land before (2) and (3) can be verified end-to-end -- wave-order
dependency. No new permission model, per ADR-0001.
