# Gemini Multimodal Workspace Compiler

Source: `raw/gemini_multimodal_workspace_compiler.tsx` (1725 lines). Standalone React/Tailwind prototype, no build system.

A product-pitch/demo for an unrelated "multimodal AI ingestion" concept -- not a QMS dashboard candidate in any real sense. Three tabs: Compiler (toggle mock Photos/Videos/Docs/Keep-notes, type a goal, generate an ADR + Task DAG via Gemini API or offline fallback -- the API key is hardcoded empty so it always hits the fallback), Cognitive Architecture (a static clickable 8-stage pipeline diagram), and Ingestion Storyboard (a 6-scene YouTube-explainer script, zero functional value). No charting library, no Dataview-equivalent record table/filter/grouping anywhere in the file.

## Feature map (see [[Dashboard Feature Gap Map]] for cross-file synthesis)

Applicable (small, salvage-only): the click-a-node-see-detail-panel interaction pattern from the pipeline diagram (could visualize SOP<->INCIDENT<->CAP relationships instead), the Markdown-to-styled-blocks renderer (generically reusable for any generated report, e.g. audit summaries), copy-to-clipboard button.

Not applicable (most of the file): the entire multimodal asset model (Photos/Video/Keep -- no OCR/vision/transcript need in a markdown QMS), Google Workspace branding/integration assumptions, the Task DAG/agent-roadmap concept, the Ingestion Storyboard tab entirely, live Gemini wiring (dead code, key always empty). No open-CAP/SOP-due/root-cause-trend functionality exists here at all -- weakest of the 3 files for this evaluation.

## Related

- [[QA-Brain - Dashboards]]
- [[Dashboard Feature Gap Map]]
