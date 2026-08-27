# 🧠 QA Mission Control

> Personal layer -- drafting, analysis, audit prep. System of record lives in EQMS.

> [!info] New QA-Brain console available
> A console with an SOP dashboard + Claude-assisted intake is live locally at `http://localhost:5173` (run `node app/backend/src/index.js` and `npm run dev` in `app/frontend` to start it). SOP is the only functional record type -- CAP, INCIDENT, CHANGE, AUDIT, and TRAINING appear in the console nav as stubs pending their vertical slice, and these Dataview dashboards remain authoritative for them until then.

---

## 🔴 Open CAPs
[[CAP]]
```dataview
TABLE status, owner, root_cause, effectiveness_status
FROM "qa-brain/CAP"
WHERE status != "Obsolete"
SORT file.ctime DESC
```

---

## ⚠️ Open Incidents
[[Incident-Trends]] 
```dataview
TABLE status, tags, file.mtime AS "Last Updated"
FROM "qa-brain/INCIDENT"
WHERE status != "Obsolete"
SORT file.ctime DESC
```

---

## 📋 SOPs Pending Review
[[SOP-Control]]
```dataview
TABLE version, status, review_date
FROM "qa-brain/SOP"
WHERE review_date <= date(today) + dur(30 days)
SORT review_date ASC
```

---

## 🔄 Recent Changes
```dataview
TABLE status, department, file.mtime AS "Modified"
FROM "qa-brain/CHANGE"
SORT file.mtime DESC
LIMIT 10
```

---

## 🎓 Training -- Incomplete
```dataview
TABLE file.link AS "Record", status
FROM "qa-brain/TRAINING"
WHERE status != "Approved"
SORT file.ctime DESC
```

---

## 📅 Upcoming Audits
[[Audit-Prep]]
```dataview
TABLE audit_type, status, effective_date
FROM "qa-brain/AUDIT"
WHERE status != "Obsolete"
SORT effective_date ASC
```

---

## Dashboards

- [[CAP-Tracker]]
- [[SOP-Control]]
- [[Audit-Prep]]
- [[Incident-Trends]]
- [[EQMS-Project-Board.canvas|EQMS Project Board (canvas)]]
