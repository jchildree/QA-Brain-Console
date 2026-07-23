# Index

Content catalog for QA-Brain-Project wiki. Purpose: track creation of this project's documents and implementation of the QMS Vault notes app (`qa-brain/`).

## Entities

- [[SOP]] -- record type, controlled procedure, auto +365d review
- [[CAP]] -- record type, corrective/preventive action, carries root_cause + effectiveness_status
- [[INCIDENT]] -- record type, center of relationship model, 5-step status tracking
- [[CHANGE]] -- record type, formal approval table + IQ/OQ/PQ checkboxes
- [[AUDIT]] -- record type, audit_type field, one instance misfiled at vault root
- [[TRAINING]] -- record type, links to SOP being trained on

## Concepts

- [[Document ID Convention]] -- {TYPE}-{YYYYMMDD}-{seq} pattern
- [[Status Lifecycle]] -- Draft -> In Review -> Approved -> Obsolete
- [[Record Relationship Model]] -- SOP <-> INCIDENT <-> CAP, AUDIT/TRAINING feed root cause
- [[Dataview Path Prefix Mismatch]] -- queries assume docs/qa-brain/ prefix, unverified
- [[IQ OQ PQ Validation Alignment]] -- vault's self-mapping to CSV concepts, unchecked
- [[Personal Layer vs System of Record]] -- vault drafts, Intellect is authoritative
- [[Dashboard Feature Gap Map]] -- cross-file synthesis of 3 tsx prototypes vs current dashboards, unresolved open questions

## Sources

- [[QA-Brain Vault]] -- parent source, ingested from raw/qa-brain/
- [[QA-Brain - SOP]]
- [[QA-Brain - CAP]]
- [[QA-Brain - INCIDENT]]
- [[QA-Brain - CHANGE]] -- has stray Excalidraw file (Zoho link)
- [[QA-Brain - AUDIT]] -- has misfiled real instance (ADR Audit.md)
- [[QA-Brain - TRAINING]] -- has stray Excalidraw file (Zoho link)
- [[QA-Brain - Templates]]
- [[QA-Brain - Dashboards]]
- [[QA-Brain - Meta]]
- [[EQMS Cognitive Compiler Dashboard]] -- free-text-to-frontmatter extraction prototype, not a status dashboard
- [[EQMS Engine Registry Sandbox]] -- lab EQMS console demo, schema-as-data blueprint pattern
- [[Gemini Multimodal Workspace Compiler]] -- unrelated product-pitch demo, ~90% not applicable
