# SOP Document Control

---

## All Controlled SOPs

```dataview
TABLE version, status, department, review_date, approved_by
FROM "qa-brain/SOP"
WHERE status != "Obsolete"
SORT status ASC, review_date ASC
```

---

## Overdue for Review

```dataview
TABLE version, review_date, owner
FROM "qa-brain/SOP"
WHERE review_date < date(today) AND status = "Approved"
SORT review_date ASC
```

---

## In Draft / Review

```dataview
TABLE version, owner, file.mtime AS "Last Modified"
FROM "qa-brain/SOP"
WHERE status = "Draft" OR status = "In Review"
SORT file.mtime DESC
```

---

## Obsolete SOPs

```dataview
TABLE version, file.mtime AS "Modified", department
FROM "qa-brain/SOP"
WHERE status = "Obsolete"
SORT file.mtime DESC
```

---

## SOP → Incident Linkage

```dataview
TABLE related_documents, department, status
FROM "qa-brain/SOP"
WHERE related_documents != null
SORT file.name ASC
```

---

## Copilot Prompts

```
Which SOPs are most frequently cited in incidents?
```

```
List all SOPs in QA department that are due for review within 60 days.
```

```
Show all SOPs linked to open CAPs.
```

---

## Related

- [[Home]]
- [[CAP-Tracker]]
- [[Incident-Trends]]
- [[Audit-Prep]]
