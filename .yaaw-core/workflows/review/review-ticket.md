# Review ticket

Use a fresh independent context.

1. Run `inspect-change`.
2. Check every acceptance criterion and required test/evidence.
3. Inspect regressions, failure paths, security/UX/accessibility requirements when relevant.
4. Run `classify-findings`.
5. Run `record-review`.

Result exactly one of `PASS`, `REPAIR`, `REPLAN`, `BLOCKED`.
