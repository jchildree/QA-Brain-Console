# Incident Trends

---

## All Open Incidents

```dataview
TABLE status, department, tags, file.mtime AS "Last Updated"
FROM "qa-brain/INCIDENT"
WHERE status != "Obsolete"
SORT file.ctime DESC
```

---

## By Root Cause (Trend View)

```dataview
TABLE rows.file.link AS "Incidents", root_cause
FROM "qa-brain/INCIDENT"
WHERE root_cause != null AND root_cause != ""
GROUP BY root_cause
SORT rows.length DESC
```

---

## By Department

```dataview
TABLE rows.file.link AS "Incidents", department
FROM "qa-brain/INCIDENT"
GROUP BY department
SORT rows.length DESC
```

---

## Incidents Without a CAP

```dataview
TABLE status, tags, file.ctime AS "Created"
FROM "qa-brain/INCIDENT"
WHERE !contains(related_documents, "CAP") AND status != "Obsolete"
SORT file.ctime ASC
```

---

## Obsoleted This Month

```dataview
TABLE file.mtime AS "Obsoleted", department
FROM "qa-brain/INCIDENT"
WHERE status = "Obsolete" AND file.mtime >= date(today) - dur(30 days)
SORT file.mtime DESC
```

---

## Copilot Prompts

```
List all incidents tagged with contamination and show their root causes.
```

```
Which incidents from the last 90 days do not have a linked CAP?
```

```
Identify repeat incident types and suggest preventive patterns.
```

---

## Related

- [[Home]]
- [[CAP-Tracker]]
- [[SOP-Control]]
- [[Audit-Prep]]
