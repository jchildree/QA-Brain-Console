# ADR-0004: Alerts Split into Shared Engine + Three Delivery Channels

## Status
Accepted

## Context

No alerts infrastructure exists today: no due/overdue detection, no email
field on users, no SMTP wiring, no web-push/VAPID/service-worker, no
scheduler. Building all three channels (in-app, web push, email) plus
detection as one plan is too much net-new infra for one execution session.

## Decision

One shared alert engine (backend route aggregating due/overdue records --
SOP review dates, aging CAPs/incidents) feeds three independent delivery
leaf plans: in-app (Overview + nav badges), web push (VAPID keys,
service-worker registration, subscription management, backend send
endpoint -- works on tablet without a native app), and email (SMTP config,
user email field, digest logic, scheduler). Slack excluded per ADR-0001.

## Consequences

The alert engine (`2026-08-25-alert-engine-backend-api.md`) must land
before any of the three channel plans -- they all read from it. The three
channels are otherwise independent and can execute in parallel.
