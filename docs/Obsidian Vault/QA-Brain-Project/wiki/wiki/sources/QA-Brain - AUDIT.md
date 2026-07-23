# QA-Brain - AUDIT

Sub-source of [[QA-Brain Vault]]. Folder `AUDIT/` -- empty (placeholder only). One real audit-type record exists outside the folder, at qa-brain root: `ADR Audit.md` (id `AUD-20260601-001`, status Draft, owner Joseph Childree, department QA, audit_type field present but unset) -- misplaced, should live under `AUDIT/`. Schema defined by `_templates/AUDIT.md`.

Extra frontmatter field: `audit_type` (Internal | External | Supplier). Sections: Scope (Department/System, Period, Auditor(s)), Findings table (ID/Finding/Severity/Status), Observations, Linked CAPs, Auditor Notes, Follow-up Actions, Closure Sign-off.

## Gap noted

`ADR Audit.md` is filed at the vault root, not `AUDIT/` -- breaks the Dataview `FROM "docs/qa-brain/AUDIT"` query in [[QA-Brain - Dashboards]]. Flagging, not fixing (raw copy is ingest-only per your Q5 answer).

## Related

- [[QA-Brain Vault]]
- [[QA-Brain - Templates]]
- [[QA-Brain - CAP]]
- [[Dataview Path Prefix Mismatch]]
