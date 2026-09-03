---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-12","kind":"DELIVERY","status":"DONE","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-11"],"acceptance":["Correct the malformed structured-ticket test fixture discovered by the new semantic CI without weakening the parser."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["tests/harness/test_query_policy.py"],"forbidden_write":["parser weakening","main branch promotion without final validation"],"expected_change_surface":["tests/harness/test_query_policy.py"],"source_fingerprints":{},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-12: Correct malformed controller test fixture

## What to deliver

Correct the malformed structured-ticket test fixture discovered by the new semantic CI without weakening the parser.

## Acceptance criteria

- [x] Fixture closes metadata with `---`.
- [x] Parser remains fail-closed.
- [x] Replacement run `33803728118` passes all gates and all 44 unit tests.

## Preservation invariants

- Production parser semantics remain unchanged.

## Allowed write scope

- `tests/harness/test_query_policy.py`

## Forbidden write scope

- parser/controller behavior.

## Expected change surface

- one malformed test fixture.

## Canonical sources

- PLAN_DELTA `DELTA-20260904-CI-FIXTURE`.
- Commit `f2c4f0d5a06600de4eb15ae612a1c51fafbed68c`.

## Verification

- GitHub Actions run `33803728118`: success, including all 44 harness tests.

## QA disposition

`INDEPENDENT_QA_REQUIRED`

## Stop and replan triggers

- Any fix requiring parser permissiveness rather than fixture correction.

## Implementation evidence

- commit/ref: `f2c4f0d5a06600de4eb15ae612a1c51fafbed68c`

## QA result

- result: `PASS` from replacement CI.

## Delivery

- commit/ref: `f2c4f0d5a06600de4eb15ae612a1c51fafbed68c`
- stage: `COMMITTED`
