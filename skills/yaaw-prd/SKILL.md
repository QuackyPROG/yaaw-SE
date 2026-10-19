---
name: yaaw-prd
description: Independently interview a user about a product, persist and review each answer batch, and build a nontechnical PRD.
---
# yaaw-prd

Read repository `AGENTS.md`, then `.yaaw-core/prd/WORKFLOW.md`, `SECTIONS.md`, and `HOOKS.md`. Use `scripts/prd.mjs` for each transaction gate. If working in another project, resolve its root and pass `--workspace` explicitly. Never invent a product decision, silently alter an accepted decision, or skip capture/review/commit. Stop for the human's answers when asking a question batch; this is the only routine human-intervention point.
