# How to Upload EQMS ADR Skill to Claude Settings

## Single File Ready to Upload: `EQMS_ADR_SKILL_COMPLETE.md`

This file contains the **complete skill definition** ready to upload to Claude.ai settings.

---

## Upload Instructions

### Step 1: Go to Claude Settings
1. Open [claude.ai](https://claude.ai)
2. Click your **profile icon** (top right)
3. Select **Settings** → **Skills** (or **Custom Skills**)

### Step 2: Create New Skill
- Click **"Add Skill"** or **"Create Skill"** button
- Or select **"Manage Skills"** → **"New Skill"**

### Step 3: Upload the File
1. Open `EQMS_ADR_SKILL_COMPLETE.md`
2. Copy the entire content (Ctrl+A, Ctrl+C)
3. Paste into the skill definition field in Claude settings
4. Or use **"Upload File"** option and select `EQMS_ADR_SKILL_COMPLETE.md`

### Step 4: Configure Skill Metadata
Claude settings should auto-detect:
- **Name:** EQMS Architectural Decision Records (ADRs)
- **Description:** Governs creation of lightweight architectural decision records for EQMS microservice
- **Tags:** architecture, decisions, governance, eqms

### Step 5: Save & Test
1. Click **Save Skill**
2. Start a new chat
3. Mention: "Create an ADR for..."
4. Skill should trigger automatically

---

## What's Included in the Single File

```
EQMS_ADR_SKILL_COMPLETE.md contains:

✅ Skill metadata (name, version, description)
✅ Trigger patterns (when Claude activates the skill)
✅ Full skill instructions (purpose, constraints, rules)
✅ Complete ADR template (ready to use)
✅ Approval checklist (Three Laws review)
✅ Naming rules (filename format, metadata)
✅ Master index protocol (how agents query ADRs)
✅ GitHub Actions validation reference
✅ Folder structure definition
✅ Example ADR (complete pattern)
✅ Quick reference for team
✅ Installation & setup instructions
✅ Token efficiency notes
✅ Support Q&A
```

**Total:** ~800 lines, self-contained, production-ready

---

## Alternative: Direct Skill Creation (No Upload)

If Claude settings doesn't have an upload feature:

1. Copy the **SKILL INSTRUCTIONS** section (from "Purpose" to "Constraint Details")
2. Paste into skill description field
3. Copy **TRIGGER PATTERNS** section
4. Set as activation triggers
5. Copy **ADR TEMPLATE** section
6. Set as the template Claude uses

---

## Verification Checklist

After uploading, verify the skill works:

- [ ] Skill appears in Settings → Skills list
- [ ] Skill name is "EQMS Architectural Decision Records (ADRs)"
- [ ] Start a new chat
- [ ] Say: "Create an ADR for state management"
- [ ] Skill triggers and shows template
- [ ] Generated ADR includes:
  - [ ] All metadata fields (Status, Affected Layers, Date, Authors)
  - [ ] Context → Decision → Consequences → Implementation structure
  - [ ] Three Laws of Readable Code checklist
  - [ ] Layer separation enforcement notes
  - [ ] Naming convention reminders

---

## What Happens After Upload

### In Every Claude Code Session
- Skill is automatically available
- Mention "Create an ADR" and it triggers
- Claude generates ADR using embedded template
- Output is ready to save as `/docs/adr/ADR-###-[slug].md`

### In Your GitHub Repo
- ADRs are saved to `/docs/adr/`
- INDEX.md is updated with new entries
- GitHub Actions validates format on every PR
- Agents (including Claude) query INDEX.md for cross-decision analysis

### For Your Team
- Share `QUICK_REFERENCE_UPDATED.md` (in outputs/)
- Teams uses consistent ADR format
- No more scattered architectural decisions
- All decisions are discoverable and enforceable

---

## If Upload Fails

### Option 1: Manual Skill Creation
Use these sections from `EQMS_ADR_SKILL_COMPLETE.md`:
- **Skill name:** Copy from "SKILL METADATA"
- **Description:** Copy "Description" section
- **Triggers:** Copy "TRIGGER PATTERNS" section
- **Instructions:** Copy "SKILL INSTRUCTIONS" section
- **Template:** Copy "ADR TEMPLATE" section

### Option 2: Contact Anthropic Support
If skill upload feature is limited, reach out to Anthropic support with:
- This file: `EQMS_ADR_SKILL_COMPLETE.md`
- Request: "Add this as a custom skill to my account"

### Option 3: Use as Reference Document
- Keep this file in your repo: `/docs/skills/eqms-adr-skill/EQMS_ADR_SKILL_COMPLETE.md`
- Reference it in Claude Code sessions
- Claude can read and apply the skill pattern without formal upload

---

## File Location Reference

```
Your GitHub Repo:
├── docs/
│   ├── adr/
│   │   ├── INDEX.md
│   │   └── ADR-###-*.md
│   └── skills/
│       └── eqms-adr-skill/
│           ├── EQMS_ADR_SKILL_COMPLETE.md    ← This file (for reference)
│           ├── SKILL.md
│           └── QUICK_REFERENCE.md
└── .github/
    └── workflows/
        └── validate-adr.yml

Claude Settings:
→ Skills → EQMS Architectural Decision Records (ADRs)
  (Uploaded from EQMS_ADR_SKILL_COMPLETE.md)
```

---

## Support

**Question:** Can I customize the skill after uploading?  
**Answer:** Yes. Edit in Claude Settings → Skills → EQMS ADR → Edit. Changes apply immediately.

**Question:** Do I need anything else?  
**Answer:** Also copy these from outputs/ to your repo:
- `validate-adr.yml` → `.github/workflows/`
- `INDEX_TEMPLATE.md` → `docs/adr/INDEX.md`
- `QUICK_REFERENCE_UPDATED.md` → `docs/skills/eqms-adr-skill/`
- `CLAUDE_UPDATED.md` → replace your existing `CLAUDE.md`

**Question:** Will the skill work offline?  
**Answer:** Only in Claude.ai or Claude Code. For offline, keep `EQMS_ADR_SKILL_COMPLETE.md` as a reference document.

---

## Next Steps

1. **Upload this file** to Claude Settings
2. **Copy supporting files** to your GitHub repo (see COMPLETE_FILE_INVENTORY.md)
3. **Test the skill** in a new Claude chat
4. **Share QUICK_REFERENCE.md** with your team
5. **Create your first ADR** using the skill

---

**File Ready:** `EQMS_ADR_SKILL_COMPLETE.md`  
**Status:** Production-ready for Claude settings upload  
**Last Updated:** May 2026
