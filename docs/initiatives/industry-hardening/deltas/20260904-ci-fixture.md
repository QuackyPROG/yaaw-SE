---yaaw-json
{
  "schema": "yaaw.plan-delta/v1",
  "id": "DELTA-20260904-CI-FIXTURE",
  "initiative": "INIT-INDUSTRY-HARDENING",
  "triggering_work": "HARDEN-11",
  "date": "2026-09-04",
  "action": "CORRECT_COMPLETED_WORK",
  "human_authority_required": false
}
---
# PLAN_DELTA: Correct malformed semantic-CI test fixture

## Trigger evidence

GitHub Actions run `33803406813` passed asset, semantic, schema, migration, Codex, workflow-state and policy-lint gates, then failed two unit tests because `tests/harness/test_query_policy.py` closed structured metadata with `---yaaw-json` instead of `---`.

## Prior assumption

`HARDEN-11` correctly added the stronger CI gates, but its newly added query/policy test fixture was assumed syntactically valid because the new CI had not yet executed it on GitHub.

## Delta decision

`CORRECT_COMPLETED_WORK`.

## Graph changes

- create: `HARDEN-12`
- supersede/cancel: none
- block/unblock/resequence: later phases depend on `HARDEN-12` succeeding.
- new frontier: after correction and green CI, continue to `HARDEN-13`.

## Completed work impact

`HARDEN-11` remains historical truth: the semantic CI implementation was delivered. `HARDEN-12` records the concrete corrective change rather than rewriting `HARDEN-11` as if the defect never existed.

## Verification / QA changes

- Replacement workflow run `33803728118` completed successfully.
- All 44 harness unit tests and all other semantic/schema/state/policy checks passed.

## Human authority required

`NO`.
