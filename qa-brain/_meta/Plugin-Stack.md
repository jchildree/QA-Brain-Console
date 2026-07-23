# Plugin Stack + Validation Reference

## Required Plugin Stack

### Core

| Plugin | Role |
|--------|------|
| Copilot | AI chat, RAG queries, document synthesis |
| Dataview | SQL-like queries, all dashboards |
| Templater | Dynamic template injection, auto IDs |
| QuickAdd | Guided creation workflows, capture |
| Tasks | Global task engine across all notes |

### Governance

| Plugin | Role |
|--------|------|
| Obsidian Git | Version control, audit trail |
| Metadata Menu | Controlled vocab enforcement on frontmatter |
| Periodic Notes | Daily/weekly review notes |
| Calendar | Date-based navigation |

### Visualization

| Plugin | Role |
|--------|------|
| Excalidraw | Process maps, system boundary diagrams |
| Canvas | Native visual workflows (built-in) |

### AI Enhancements

| Plugin | Role |
|--------|------|
| Smart Connections | RAG augmentation, semantic search |
| GitHub Copilot (optional) | Inline authoring assist |

---

## Validation Alignment (IQ / OQ / PQ)

This vault is your *personal layer*, not a validated system. However, the structure maps cleanly to CSV concepts — useful for your own confidence and for explaining the system to auditors if needed.

### IQ — Installation Qualification

Confirm the environment is set up correctly.

- [ ] All required plugins installed and enabled
- [ ] Vault folder structure matches spec (`_templates`, `_dashboards`, SOP, CAP, etc.)
- [ ] Templater pointed at `_templates/` folder
- [ ] Obsidian Git initialized with remote backup
- [ ] Metadata Menu field classes configured

### OQ — Operational Qualification

Confirm workflows behave as designed.

- [ ] QuickAdd → New CAP creates file in `CAP/` with correct ID format
- [ ] QuickAdd → New Incident prompts for title and opens template
- [ ] Dataview CAP dashboard returns correct results on test data
- [ ] Dataview Incident Trends groups by root_cause correctly
- [ ] Copilot can query across vault and return relevant notes
- [ ] Obsidian Git auto-commits on schedule

### PQ — Performance Qualification

Confirm the system works in real use.

- [ ] One real CAP created and tracked to closure
- [ ] Audit prep dashboard used to generate a findings summary
- [ ] Copilot used to identify a recurring root cause
- [ ] SOP Document Control dashboard used during a review cycle

---

## Copilot Enterprise Prompts

### SOP Lookup
```
Show deviation handling procedure for HPLC.
```

### CAP Analysis
```
Summarize root causes across all CAPs tagged contamination.
```

### Audit Prep
```
List all documents updated in the last 30 days.
```

### Trend Detection
```
What are the most common root causes across all incidents this quarter?
```

### Knowledge Graph
```
What systems and SOPs connect to the Intellect integration?
```

### Inspection Readiness
```
Are there any open CAPs or incidents that would be a finding in an FDA inspection?
```

---

## Related

- [[README]]
- [[Automation-Setup]]
- [[Home]]
