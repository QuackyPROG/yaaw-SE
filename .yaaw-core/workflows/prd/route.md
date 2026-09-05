# PRD route

Inspect `.yaaw/product.md` and current request, then select exactly one: `CREATE`, `CONTINUE`, `REFINE`, `REVISE`, `READY`.

- Missing product artifact -> `CREATE`.
- Partial artifact with unresolved product questions -> `CONTINUE`.
- Existing artifact needing clarity without intent change -> `REFINE`.
- Human requests changed product intent -> `REVISE`.
- Accepted product intent is sufficient for the current frontier -> `READY`.

Do not infer engineering choices as product decisions.
