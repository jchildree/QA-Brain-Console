# QA-Brain - Templates

Sub-source of [[QA-Brain Vault]]. Folder `_templates/` -- 6 Templater templates, one per record type (SOP, CAP, INCIDENT, CHANGE, AUDIT, TRAINING).

Common frontmatter across all 6: `id` (auto-generated `{TYPE}-{YYYYMMDD}-001` via Templater), `type`, `status` (default Draft), `version` (default 1.0), `owner` (default "Joseph Childree"), `created`/`modified` (today), `approved_by`, `effective_date`, `review_date`, `department` (default QA), `tags`, `related_documents`, `related_records`. CAP/INCIDENT/CHANGE/AUDIT/TRAINING add `source: internal`. CAP adds `root_cause` + `effectiveness_status: Pending`. AUDIT adds `audit_type`.

Note: SOP template's `review_date` auto-offsets +365 days from creation (`tp.date.now("YYYY-MM-DD", 365)`) -- the only template with a non-empty default review cadence.

## Related

- [[QA-Brain Vault]]
- [[Document ID Convention]]
- [[Status Lifecycle]]
