# CAP Tracker

---

## All Open CAPs
[[CAP]]
```dataview
TABLE status, owner, root_cause, effectiveness_status, file.mtime AS "Last Updated"
FROM "docs/qa-brain/CAP"
WHERE status != "Closed"
SORT status ASC
```

---

## Effectiveness Check Due

```dataview
TABLE effectiveness_status, review_date, owner
FROM "docs/qa-brain/CAP"
WHERE effectiveness_status = "Pending" AND review_date <= date(today) + dur(14 days)
SORT review_date ASC
```

---

## CAP → Incident Traceability
[[Incident-Trends]]
```dataview
TABLE related_records, root_cause, status
FROM "docs/qa-brain/CAP"
SORT created DESC
```

---

## Recurring Root Causes

```dataview
TABLE rows.file.link AS "CAPs", root_cause
FROM "docs/qa-brain/CAP"
WHERE root_cause != null AND root_cause != ""
GROUP BY root_cause
SORT rows.length DESC
```

---

## Copilot Prompts

Paste these directly into Copilot chat:

```
Summarize recurring root causes across all CAPs.
```

```
List all CAPs where effectiveness checks failed or were repeated.
```

```
Which SOPs are most frequently referenced across incidents and CAPs?
```

---

## Related

- [[Home]]
- [[Incident-Trends]]
- [[SOP-Control]]
- [[Audit-Prep]]
