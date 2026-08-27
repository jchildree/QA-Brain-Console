# Audit Prep

---

## Open Audit Findings

```dataview
TABLE audit_type, status, file.mtime AS "Last Updated"
FROM "qa-brain/AUDIT"
WHERE status != "Obsolete"
SORT file.ctime DESC
```

---

## Findings → CAP Traceability

```dataview
TABLE related_documents, department, status
FROM "qa-brain/AUDIT"
SORT file.ctime DESC
```

---

## Documents Updated (Last 30 Days)

```dataview
TABLE type, status, version, file.mtime AS "Modified"
FROM "qa-brain/SOP" OR "qa-brain/CAP" OR "qa-brain/INCIDENT" OR "qa-brain/CHANGE"
WHERE file.mtime >= date(today) - dur(30 days)
SORT file.mtime DESC
```

---

## Recently Approved Documents

```dataview
TABLE type, version, approved_by, effective_date
FROM "qa-brain/SOP" OR "qa-brain/CAP" OR "qa-brain/INCIDENT" OR "qa-brain/CHANGE" OR "qa-brain/AUDIT" OR "qa-brain/TRAINING"
WHERE status = "Approved" AND effective_date >= date(today) - dur(90 days)
SORT effective_date DESC
```

---

## Training Compliance

```dataview
TABLE status, department, file.mtime AS "Completed"
FROM "qa-brain/TRAINING"
WHERE status = "Approved"
SORT file.mtime DESC
```

---

## Copilot Prompts — Audit Readiness

```
List all CAPs linked to audit findings with open status.
```

```
Show all documents updated in the last 30 days by type.
```

```
Identify any SOPs without a training record linked.
```

```
Summarize the current state of all open corrective actions.
```

---

## Related

- [[Home]]
- [[CAP-Tracker]]
- [[Incident-Trends]]
- [[SOP-Control]]
