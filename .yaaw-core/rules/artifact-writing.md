# Artifact writing rules

- Prefer concise durable facts over chat transcripts.
- Markdown artifacts use YAML frontmatter for schema/id/revision/status metadata and Markdown body for reasoning.
- Reference decision/artifact IDs instead of duplicating planning history.
- Keep product language product-focused.
- Separate repository observations from assumptions.
- Include provenance when a decision depends on a product requirement, prior decision, spec, observed code, or review finding.
- Reviews are append-only rounds; never overwrite prior findings.
- Stale/superseded artifacts remain readable and explicitly marked; do not silently rewrite history.

- Every material research claim cites source/provenance; version-sensitive external facts record version/date.
- Summarize research history; do not paste whole web pages or transcripts.
- Testing evidence records the behavioral signal, not only command exit status.
- Every Reviewer finding identifies its lens.
