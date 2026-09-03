---yaaw-json
{"schema":"yaaw.ticket/v1","id":"HARDEN-08","kind":"DELIVERY","status":"DONE","level":4,"parent":"INIT-INDUSTRY-HARDENING","owner":"orchestrator","blocked_by":["HARDEN-07"],"acceptance":["Expose ticket/blocker/owner/artifact/context/route/transition inspection and fail-closed policy lint."],"qa":{"required":true,"profile":"HIGH_ASSURANCE"},"allowed_write":["scripts/yaaw/**","docs/workflow/controller-cli.md","tests/harness/**"],"forbidden_write":["main branch promotion without final validation"],"expected_change_surface":["scripts/yaaw/**","docs/workflow/controller-cli.md","tests/harness/**"],"source_fingerprints":{},"risk":["agent-harness-control-plane"],"side_effects":["repository"]}
---
# HARDEN-08: Deterministic operator CLI and policy lint

## What to deliver

Expose ticket/blocker/owner/artifact/context/route/transition inspection and fail-closed policy lint.

## Acceptance criteria

- [x] Deterministic state is inspectable without asking an LLM to recalculate it.
- [x] Transition command is dry-run rather than hidden mutation.
- [x] Commit `ea89a8370d08320bd1019812b68a51280e93ffdb` records the phase.

## Preservation invariants

- Inspection does not mutate durable state.

## Allowed write scope

- CLI/query/lint/docs/tests.

## Forbidden write scope

- `main` promotion until final validation.

## Expected change surface

- operator-facing controller surfaces.

## Canonical sources

- Commit `ea89a8370d08320bd1019812b68a51280e93ffdb`.

## Verification

- CLI/query/policy tests and CI.

## QA disposition

`INDEPENDENT_QA_REQUIRED`

## Stop and replan triggers

- A CLI convenience bypasses controller admission.

## Implementation evidence

- commit/ref: `ea89a8370d08320bd1019812b68a51280e93ffdb`

## QA result

- result: `PASS`.

## Delivery

- commit/ref: `ea89a8370d08320bd1019812b68a51280e93ffdb`
- stage: `COMMITTED`
