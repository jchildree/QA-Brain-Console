# ADR-0001: Project Scope and Approach

## Status
Accepted

## Context

User wants QA Brain console to work like a QA "Jarvis" work assistant: a
persistent chat assistant, proactive alerts, and smarter (low-risk)
automation layered on the existing full-stack app (`app/backend` Express +
`app/frontend` React console, 7 record types, Claude-proxied AI, auth,
evidence library). Priority is **stabilize first** -- audit the existing
console for stubs/bugs/dead ends across backend routes, frontend
pages/blueprints, and vault dashboards -- before building new Jarvis
capability. User will not pre-list known bugs; the audit must find them.

Deployment groundwork exists (`docker-compose.prod.yml`, `deploy/Caddyfile`,
TLS certs dir) but nothing is actually running yet. 3 real users total
(joseph/admin, an IT person, a QA person) -- existing 2-role auth
(admin/user) is sufficient, no new permission model needed. SMTP creds are
available for email alerts; Slack is not set up (out of scope for now).
Tablet access is required, which needs the prod stack actually deployed and
reachable, not just composed.

## Decision

Two phases, coarsest cut:

1. **Stabilization pass** -- audit backend (`routes/`, `providers/`,
   `middleware/`, `vault.js`), frontend (all `pages/`, `blueprint/`,
   `components/`), and vault dashboards (`_dashboards/*.md` Dataview
   queries) for stubs, broken flows, dead links, schema/frontmatter
   mismatches, and leftover ADR-002 "coming soon" remnants. Produce a fix
   list, then fix it. Includes actually standing up the prod Docker/Caddy
   stack so the console is reachable from a tablet on the LAN.
2. **Jarvis capability pass** (after stabilization) -- three features on top
   of the stabilized console:
   - **Persistent chat assistant**: read + draft, scoped by which record
     areas the user allows it to draft into; reuses existing admin/user
     roles, no new permission model.
   - **Proactive alerts**: in-app (Overview/nav badges) + native/web push
     (works on tablet, so PWA-style push not a native mobile app) + email
     via existing SMTP creds. Slack excluded (no workspace/creds yet).
   - **Smarter automation**: auto-act on low-risk actions only (auto-link
     related records, auto-tag, auto-fill obvious fields). Never auto-changes
     record `status` or approval state -- those stay human-gated.

## Consequences

Excluded from this scope: voice interface, Slack alert delivery, any new
multi-tier permission/role system beyond admin/user, and auto-actions that
touch record status/approval.

Open items already answered during intake (recorded here so later levels
don't re-derive them): app is not yet deployed (deploy is in-scope work,
not assumed done); SMTP available, Slack is not; 3-user base, existing
2-role auth is enough; automation is suggest-by-default except for the named
low-risk auto-actions above.
