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

### New Meeting Minutes

- **Type:** Template
- **Template path:** `_templates/MEETING.md`
- **File name format:** `MTG-{{DATE:YYYYMMDD}}-{{NAME}}`
- **Folder:** `MEETING/`
- **Open after creation:** Yes

---

## Bulk File Import (PPTX / OneNote / Markdown) -- one click, no terminal

`_meta/ingest_notes.py` converts a folder of mixed files into `NOTE-YYYYMMDD-NNN.md`
records. It runs inside Docker (`_meta/Dockerfile` + `_meta/ingest.cmd`) so Python
never touches the host. `.cmd` not `.ps1` -- batch files aren't gated by PowerShell
execution policy, so this runs on a fresh machine with no policy change needed.
PDF/Word don't need this path -- use Obsidian's core **Importer** plugin for those.

### One-time setup

1. Install Docker Desktop.
2. Install the **Shell commands** community plugin in Obsidian.
3. Add a shell command:
   - **Shell:** `cmd.exe`
   - **Command:** `qa-brain\_meta\ingest.cmd "{{source_folder}}"`
   - **Working directory:** vault root (repo root, where `.obsidian/` lives -- not `qa-brain/`)
   - **Variable prompt:** `source_folder` (text input, folder path)
4. Bind it to a hotkey or ribbon icon.

### Use

Trigger the shell command, paste the folder path when prompted. Notes land in
`Notes/` tagged with the source folder name; PPTX gets an extra `powerpoint` tag.
OneNote `.one`/`.onepkg` files need `onenote-md-exporter` on the host PATH -- if
missing, those files are skipped with a message rather than failing the batch.

---

## Web Clipper (browser/clipboard capture)

Use Obsidian's official **Web Clipper** browser extension -- no custom code needed.

1. Install the extension, point it at this vault.
2. Create a template:
   - **Note location:** `Notes`
   - **Filename:** `NOTE-{{date:YYYYMMDD}}-{{time:HHmmss}}` (timestamp instead of a
     sequence number -- the extension can't see other files in the folder to
     count a sequence; still sorts chronologically)
   - **Properties:** `title: {{title}}`, `folder: web-clip`, `id: {{filename}}`,
     `tags: []`, `related_documents: []`
   - **Content:** page content + `{{url}}` as a source line
3. Clip via the browser toolbar button or right-click menu; note is created directly
   in `Notes/` with no intermediate app.

---

## Obsidian Git Setup (Governance / Audit Trail)

Provides full version history -- every save is a commit.

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
| `type` | Select | SOP, CAP, INCIDENT, CHANGE, AUDIT, TRAINING, MEETING |
| `department` | Select | QC, QA, IT, Operations |
| `effectiveness_status` | Select | Pending, Pass, Fail, N/A |

This prevents typos from breaking Dataview queries.

---

## Related

- [[Plugin-Stack]]
- [[README]]
