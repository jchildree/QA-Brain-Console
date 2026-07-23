# AUDIT

Record type. Internal/External/Supplier audit report. ID pattern `AUD-{YYYYMMDD}-001`. Only record type with an `audit_type` field. Feeds root-cause analysis (per CLAUDE.md relationship model: AUDIT -> INCIDENT/root cause).

Known gap: one real instance (`ADR Audit.md`, id AUD-20260601-001) is misfiled at vault root instead of `AUDIT/` -- see [[QA-Brain - AUDIT]].

## Related

- [[QA-Brain - AUDIT]]
- [[Document ID Convention]]
- [[Record Relationship Model]]
