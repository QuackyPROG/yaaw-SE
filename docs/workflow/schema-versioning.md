# Schema Versioning and Migrations

Durable yaaw-SE artifacts carry an explicit `schema` identifier in `---yaaw-json` metadata. File names are navigation; schema IDs and stable artifact/work IDs are machine identity.

Current core schemas are registered in `scripts/yaaw/schema_versions.py`. New incompatible shapes require a new schema version and an explicit migration function. Unknown or skipped versions fail closed; agents must never "best guess" a historical artifact into the current shape.

`migrate_file()` is dry-run by default. When write mode is explicitly selected it writes a sibling temporary file and atomically replaces the original. Migration changes structure only; they must not reinterpret product intent, architectural decisions, QA results, or completed work history.

The first declared compatibility migration upgrades `yaaw.ticket/v0` metadata to `yaaw.ticket/v1`, including the old `qa_required` field. New PRD, SPEC, ADR, initiative-map, and PLAN_DELTA templates start at v1.
