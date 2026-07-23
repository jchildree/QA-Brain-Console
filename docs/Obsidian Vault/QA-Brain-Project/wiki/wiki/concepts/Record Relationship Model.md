# Record Relationship Model

```
SOP <-- INCIDENT --> CAP
              ^          v
           AUDIT    Root Cause
              ^
           TRAINING
```

Records cross-link via `related_documents` / `related_records` frontmatter and `[[wikilinks]]`, not folder nesting. AUDIT and TRAINING feed INCIDENT/root-cause analysis; INCIDENT sits between SOP (what was breached) and CAP (what fixes it).

## Related

- [[SOP]] [[INCIDENT]] [[CAP]] [[AUDIT]] [[TRAINING]]
- [[QA-Brain Vault]]
