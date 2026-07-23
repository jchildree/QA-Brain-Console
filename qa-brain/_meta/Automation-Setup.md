# Automation + Governance Setup

## QuickAdd Workflows

Configure these in QuickAdd settings. Each is a **Template** choice + **Capture** trigger.

---

### New SOP

- **Type:** Template
- **Template path:** `_templates/SOP.md`
- **File name format:** `SOP-{{DATE:YYYYMMDD}}-{{NAME}}`
- **Folder:** `SOP/`
- **Open after creation:** Yes

---

### New Incident

- **Type:** Template
- **Template path:** `_templates/INCIDENT.md`
- **File name format:** `INC-{{DATE:YYYYMMDD}}-{{NAME}}`
- **Folder:** `INCIDENT/`
- **Open after creation:** Yes

---

### New CAP

- **Type:** Template + Capture
- **Template path:** `_templates/CAP.md`
- **File name format:** `CAP-{{DATE:YYYYMMDD}}-{{NAME}}`
- **Folder:** `CAP/`
- **Prompts:**
  - Title
  - Linked incident (pre-fills `related_records`)
- **Open after creation:** Yes

---

### New Change Request

- **Type:** Template
- **Template path:** `_templates/CHANGE.md`
- **File name format:** `CHG-{{DATE:YYYYMMDD}}-{{NAME}}`
- **Folder:** `CHANGE/`
- **Open after creation:** Yes

---

### New Training Record

- **Type:** Template
- **Template path:** `_templates/TRAINING.md`
- **File name format:** `TRN-{{DATE:YYYYMMDD}}-{{NAME}}`
- **Folder:** `TRAINING/`
- **Open after creation:** Yes

---

## Obsidian Git Setup (Governance / Audit Trail)

Provides full version history — every save is a commit.

### Setup steps

1. Install **Obsidian Git** community plugin
2. Initialize a local git repo in your vault root:
   ```bash
   git init
   git add .
   git commit -m "Initial vault commit"
   ```
3. (Optional) Push to a private GitHub repo for offsite backup
4. In plugin settings, enable **Auto backup every N minutes** (recommend: 15)
5. Enable **Pull on startup** if using multi-device sync

### What this gives you

- Full diff history on every document
- Revertible changes (no accidental permanent edits)
- Commit log = audit trail of all modifications
- Pairs with 21 CFR Part 11 concepts (though Obsidian is your personal layer, not the validated system)

---

## Templater Global Settings

In Templater plugin settings:

| Setting | Value |
|---------|-------|
| Template folder | `_templates` |
| Trigger on new file creation | Enabled |
| Enable system commands | Disabled (security) |
| Timeout | 5000ms |

---

## Metadata Menu Setup (Optional but High Value)

Metadata Menu lets you enforce controlled vocabulary on frontmatter fields.

### Recommended field classes

| Field | Type | Values |
|-------|------|--------|
| `status` | Select | Draft, In Review, Approved, Obsolete |
| `type` | Select | SOP, CAP, INCIDENT, CHANGE, AUDIT, TRAINING |
| `department` | Select | QC, QA, IT, Operations |
| `effectiveness_status` | Select | Pending, Pass, Fail, N/A |

This prevents typos from breaking Dataview queries.

---

## Related

- [[Plugin-Stack]]
- [[README]]
